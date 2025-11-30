# api/main.py
import os
import uvicorn
from fastapi import FastAPI, HTTPException, Body, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import logging
import traceback
import logging
from fastapi import HTTPException

# import your routing modules (adjust if paths differ)

from routing.graph_builder import build_graph
# prefer using your path_finder module; fallback to networkx simple paths if not available
try:
    from routing.path_finder import top_k_paths
except Exception:
    top_k_paths = None

from routing import inference
try:
    # scoring util (your file might be named route_scoring or similar)
    from routing.route_scoring import score_route_summary
except Exception:
    # fallback scoring function if missing — simple weighted sum
    def score_route_summary(summary, w_cost=0.6, w_time=0.2, w_risk=0.2):
        # normalize inputs heuristically (ensure non-zero)
        c = summary.get("total_cost", 0.0)
        t = summary.get("total_time", 0.0)
        r = summary.get("total_risk", 0.0)
        return float(w_cost * c + w_time * t + w_risk * r)
from api import schemas

log = logging.getLogger("capiflow-api")

app = FastAPI(title="Capital Routing API", version="0.1")

# Allow CORS for local React dev; restrict origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],  # update in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(
    prefix="/api",
    tags=["API"]  # Optional: for grouping in documentation
)

def _build_graph_cached(reload: bool = False):
    """
    Lazy-load / build graph. Uses build_graph() from routing.graph_builder.
    """
    # keep global cache in module
    global _GRAPH
    if "_GRAPH" not in globals() or reload:
        log.info("Building graph (predict_edges=True, cache_csv=True)...")
        _GRAPH = build_graph(predict_edges=True, cache_csv=True)
    return _GRAPH

@api_router.get("/routes/comparison")
def get_comparison_live():
    """
    Produce a demo comparison but backed by the real routing engine.
    We'll show sample scenarios (IN->US, IN->SG, IN->NL). Replace or extend as desired.
    """
    try:
        G = _build_graph_cached()
    except Exception as e:
        log.exception("Failed to build graph")
        raise HTTPException(status_code=500, detail="Failed to build corridor graph: " + str(e))

    # sample scenarios to compute (you can change these)
    samples = [
        ("India", "United States"),
        ("India", "Singapore"),
        ("India", "Netherlands")
    ]

    results = []
    for src, dst in samples:
        if src not in G or dst not in G:
            # fallback to a simple demo entry if countries are missing
            results.append({
                "route": f"{src} -> {dst}",
                "net": "-",
                "friction": "-",
                "vsDirect": "-",
                "time": "-",
                "risk": "-",
                "path": [],
                "tags": []
            })
            continue

        # find top-k paths (try your top_k_paths util first)
        try:
            if top_k_paths is not None:
                paths = top_k_paths(G, src, dst, k=3, max_hops=3)
            else:
                # use networkx as fallback (shortest_simple_paths by weight 'total_cost_pct' or 'friction')
                import networkx as nx
                generator = nx.shortest_simple_paths(G, src, dst, weight="total_cost_pct")
                paths = []
                for p in generator:
                    paths.append(p)
                    if len(paths) >= 3:
                        break
        except Exception as e:
            log.warning("Path finding failed for %s->%s: %s", src, dst, e)
            paths = []

        if not paths:
            results.append({
                "route": f"{src} -> {dst}",
                "net": "-",
                "friction": "-",
                "vsDirect": "-",
                "time": "-",
                "risk": "-",
                "path": [],
                "tags": []
            })
            continue

        # take best path by composite score (compute for each)
        scored = []
        for path in paths:
            total_cost = 0.0
            total_time = 0.0
            total_risk = 0.0
            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                attrs = dict(G[u][v])
                # ensure prediction fields exist; use inference.predict_edge_metrics if missing or zero
                if not attrs.get("total_cost_pct") or not attrs.get("friction") or not attrs.get("settlement_time_days"):
                    try:
                        preds = inference.predict_edge_metrics(attrs)
                        attrs["friction"] = float(preds.get("friction", attrs.get("friction", 0.0)))
                        attrs["total_cost_pct"] = float(preds.get("total_cost_pct", attrs.get("total_cost_pct", 0.0)))
                        attrs["settlement_time_days"] = float(preds.get("settlement_time_days", attrs.get("settlement_time_days", 0.0)))
                    except Exception:
                        # best-effort fallback: approximate
                        fx = float(attrs.get("fx_spread_bps", 0.0)) / 100.0
                        fee = float(attrs.get("transfer_fee_percent", 0.0))
                        tax_pct = float(attrs.get("tax_rate_percent", 0.0)) / 100.0
                        approx = fx + fee + tax_pct
                        attrs.setdefault("friction", approx)
                        attrs.setdefault("total_cost_pct", approx)
                        attrs.setdefault("settlement_time_days", max(0.1, float(attrs.get("settlement_time_days", 0.1))))

                total_cost += float(attrs.get("total_cost_pct", 0.0))
                total_time += float(attrs.get("settlement_time_days", 0.0))
                total_risk += float(attrs.get("friction", 0.0))

            # default weights (you can accept from request in compute_routes)
            composite = score_route_summary({"total_cost": total_cost, "total_time": total_time, "total_risk": total_risk}, 0.6, 0.2, 0.2)
            scored.append({
                "path": path,
                "total_cost": total_cost,
                "total_time": total_time,
                "total_risk": total_risk,
                "composite": composite
            })

        # pick best by composite (lower is better if your scoring treats lower better — adapt if inverted)
        best = min(scored, key=lambda x: x["composite"])
        # craft a human-friendly card
        results.append({
            "route": f"{src}→{dst}",
            "net": "See details",
            "friction": f"{best['total_risk']:.3f}",
            "vsDirect": "compute in UI",
            "time": f"{best['total_time']:.2f}d",
            "risk": f"{(best['total_risk']):.2f}",
            "path": best["path"],
            "tags": ["Computed"]
        })

    # also return a "fullComparison" using the first sample computed routes (optional)
    return {
        "comparisonData": results,
        "fullComparisonData": [],  # you can fill with aggregated stats if you want
        "hopComparisonData": []
    }

@api_router.post("/explain-edge")
def explain_edge(req: schemas.ExplainEdgeRequest):
    G = get_graph()
    src = req.source_country
    dst = req.destination_country
    if not G.has_edge(src, dst):
        raise HTTPException(status_code=404, detail="Edge not found in graph.")
    raw_row = dict(G[src][dst])
    try:
        pred, shap_df, summary, _ = inference.explain_edge_metrics(raw_row, target=req.target).values()
        # return a small JSONable explanation
        return {"prediction": float(pred), "shap_top": shap_df}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post('/route/explain')
def explain_route(payload: Dict[str, Any]):
    """
    Explain a given route using SHAP values for each edge.
    Payload example:
      {
        "origin": "India",
        "destination": "United States",
        "amount_musd": 500000000,
        "weights": {"cost":0.6,"time":0.2,"risk":0.2},
        "route": ["India", "Singapore", "United States"]
      }
    """
    try:
        origin = payload.get("origin")
        destination = payload.get("destination")
        amount_musd = payload.get("amount_musd", None)
        weights = payload.get("weights", {"cost": 0.6, "time": 0.2, "risk": 0.2})
        route = payload.get("route", [])

        if not origin or not destination or not route:
            raise HTTPException(status_code=400, detail="origin, destination, and route are required")

        G = _build_graph_cached()
        explanations = []
        for i in range(len(route) - 1):
            src = route[i]
            dst = route[i + 1]
            if not G.has_edge(src, dst):
                raise HTTPException(status_code=404, detail=f"Edge {src}->{dst} not found in graph.")
            raw_row = dict(G[src][dst])
            edge_expl = inference.explain_edge_metrics(raw_row)
            explanations.append({
                "from": src,
                "to": dst,
                "prediction": edge_expl["predict"],
                "shap_top": edge_expl["shap_df"]
            })

        return {
            "origin": origin,
            "destination": destination,
            "amount_musd": amount_musd,
            "weights": weights,
            "route": route,
            "explanations": explanations
        }

    except HTTPException:
        raise
    except Exception as e:
        log.exception("explain_route failed")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/compute-route")
def compute_routes(payload: Dict[str, Any]):
    """
    Compute top-K routes for a single request using your engine.
    Payload example:
      {
        "source": "India",
        "destination": "United States",
        "amount": 500000000,
        "weights": {"cost":0.6,"time":0.2,"risk":0.2},
        "k": 3,
        "max_hops": 3,
        "higher_is_better": False   # optional: set True if a larger composite indicates better route
      }
    """
    try:
        src = payload.get("source")
        dst = payload.get("destination")
        amount = payload.get("amount", None)
        weights = payload.get("weights", {"cost": 0.6, "time": 0.2, "risk": 0.2})
        k = int(payload.get("k", 3))
        max_hops = int(payload.get("max_hops", 3))
        higher_is_better = bool(payload.get("higher_is_better", False))  # default: lower is better

        if not src or not dst:
            raise HTTPException(status_code=400, detail="source and destination required")

        G = _build_graph_cached()
        if src not in G or dst not in G:
            raise HTTPException(status_code=404, detail="Source or destination not found in graph")

        # find candidate paths
        if top_k_paths is not None:
            paths = top_k_paths(G, src, dst, k=k, max_hops=max_hops)
        else:
            import networkx as nx
            generator = nx.shortest_simple_paths(G, src, dst, weight="total_cost_pct")
            paths = []
            for p in generator:
                if len(p) - 1 <= max_hops:
                    paths.append(p)
                if len(paths) >= k:
                    break

        if not paths:
            raise HTTPException(status_code=404, detail="No paths found")

        response = []
        for path in paths:
            edges = []
            total_cost = 0.0
            total_time = 0.0
            total_risk = 0.0

            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                attrs = dict(G[u][v])

                # Ensure predicted metrics present, otherwise compute on-demand
                if not attrs.get("friction") or not attrs.get("total_cost_pct") or not attrs.get("settlement_time_days"):
                    try:
                        preds = inference.predict_edge_metrics(attrs)
                        attrs["friction"] = float(preds.get("friction", attrs.get("friction", 0.0)))
                        attrs["total_cost_pct"] = float(preds.get("total_cost_pct", attrs.get("total_cost_pct", 0.0)))
                        attrs["settlement_time_days"] = float(preds.get("settlement_time_days", attrs.get("settlement_time_days", 0.0)))
                    except Exception:
                        fx = float(attrs.get("fx_spread_bps", 0.0)) / 100.0
                        fee = float(attrs.get("transfer_fee_percent", 0.0))
                        tax_pct = float(attrs.get("tax_rate_percent", 0.0)) / 100.0
                        approx = fx + fee + tax_pct
                        attrs.setdefault("friction", approx)
                        attrs.setdefault("total_cost_pct", approx)
                        attrs.setdefault("settlement_time_days", max(0.1, float(attrs.get("settlement_time_days", 0.1))))

                fr = float(attrs.get("friction", 0.0))
                cost = float(attrs.get("total_cost_pct", fr))
                time_days = float(attrs.get("settlement_time_days", 0.0))

                edges.append({
                    "from": u,
                    "to": v,
                    "friction": fr,
                    "total_cost_pct": cost,
                    "settlement_time_days": time_days,
                    "meta": {
                        "corridor_volume_musd": attrs.get("corridor_volume_musd"),
                        "withholding_tax_amount_musd": attrs.get("withholding_tax_amount_musd")
                    }
                })

                total_cost += cost
                total_time += time_days
                total_risk += fr

            # Try to get a numeric composite score from your scoring util
            raw_score_obj = score_route_summary({"total_cost": total_cost, "total_time": total_time, "total_risk": total_risk},
                                                weights.get("cost", 0.6),
                                                weights.get("time", 0.2),
                                                weights.get("risk", 0.2))

            # Normalize to float
            def _extract_numeric_score(obj, fallback):
                # direct numeric
                if isinstance(obj, (int, float)):
                    return float(obj)
                # dicts with common keys
                if isinstance(obj, dict):
                    for k in ("score", "composite", "value", "score_value"):
                        if k in obj:
                            try:
                                return float(obj[k])
                            except Exception:
                                pass
                    # maybe nested: try 'meta'->'score'
                    if "meta" in obj and isinstance(obj["meta"], dict) and "score" in obj["meta"]:
                        try:
                            return float(obj["meta"]["score"])
                        except Exception:
                            pass
                # try to cast
                try:
                    return float(obj)
                except Exception:
                    return fallback

            fallback_numeric = weights.get("cost", 0.6) * total_cost + weights.get("time", 0.2) * total_time + weights.get("risk", 0.2) * total_risk
            composite_numeric = _extract_numeric_score(raw_score_obj, fallback_numeric)

            # ensure not NaN
            if composite_numeric != composite_numeric:  # NaN check
                composite_numeric = fallback_numeric

            response.append({
                "path": path,
                "hops": len(path) - 1,
                "edges": edges,
                "total_cost": total_cost,
                "total_time": total_time,
                "total_risk": total_risk,
                # keep original raw score for debugging + numeric normalized score
                "composite_raw": raw_score_obj,
                "composite_score": float(composite_numeric)
            })

        # sort by composite numeric (if higher_is_better True, sort descending)
        response = sorted(response, key=lambda r: r["composite_score"], reverse=bool(higher_is_better))

        return {"source": src, "destination": dst, "amount": amount, "results": response}

    except HTTPException:
        raise
    except Exception as e:
        log.exception("compute_routes failed")
        raise HTTPException(status_code=500, detail=str(e))
    
app.include_router(api_router)