# api/main.py
import os
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import logging
import traceback

# import your routing modules (make sure PYTHONPATH includes project root)
from routing import inference
from routing.graph_builder import build_graph
from routing.path_finder import top_k_paths   # implement/find this utility
from routing.route_scoring import score_route_summary  # implement scoring function
from api import schemas

log = logging.getLogger("uvicorn.error")

app = FastAPI(title="Capital Routing API", version="0.1")

# Allow CORS for local React dev; restrict origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],  # update in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy-load graph on first use
_GRAPH = None
def get_graph(reload: bool = False):
    global _GRAPH
    if _GRAPH is None or reload:
        log.info("Building graph (predict_edges=True, cache_csv=True)...")
        _GRAPH = build_graph(predict_edges=True, cache_csv=True)
    return _GRAPH

@app.get("/health", response_model=schemas.HealthResponse)
def health():
    G = get_graph()
    models = inference.models_available()
    return {"status": "ok", "models_loaded": models, "nodes": len(G.nodes()), "edges": len(G.edges())}

@app.post("/predict-edge", response_model=schemas.PredictEdgeResponse)
def predict_edge(req: schemas.PredictEdgeRequest):
    # if frontend provides full feature dict, use it; else try to find row in corridor dataset
    raw_row = {}
    if req.features:
        raw_row = req.features
        # ensure source/dest are included
        raw_row.setdefault("source_country", req.source_country)
        raw_row.setdefault("destination_country", req.destination_country)
    else:
        # look up in processed CSV by source/destination (non-unique corridors allowed)
        G = get_graph()
        # try direct edge attributes
        data = None
        if G.has_edge(req.source_country, req.destination_country):
            data = G[req.source_country][req.destination_country]
            raw_row = dict(data)
        else:
            raise HTTPException(status_code=404, detail="Corridor not found and no features provided.")
    preds = inference.predict_edge_metrics(raw_row)
    # ensure clipping already done in inference; but be safe here
    preds["friction"] = max(0.0, float(preds["friction"]))
    preds["total_cost_pct"] = max(0.0, float(preds["total_cost_pct"]))
    preds["settlement_time_days"] = max(0.1, float(preds["settlement_time_days"]))
    return schemas.PredictEdgeResponse(**preds)

@app.post("/routes")
def get_routes(req: schemas.RouteRequest):
    G = get_graph()
    src = req.source
    dst = req.destination
    if src not in G or dst not in G:
        raise HTTPException(status_code=404, detail="Source or destination not in graph.")
    # find k paths (implement in path_finder.py)
    k = req.k or 3
    max_hops = req.max_hops or 3
    paths = top_k_paths(G, src, dst, k=k, max_hops=max_hops)
    if not paths:
        raise HTTPException(status_code=404, detail="No routes found.")

    results = []
    for path in paths:
        # build edge list
        edges = []
        total_cost = 0.0
        total_time = 0.0
        total_risk = 0.0
        for i in range(len(path)-1):
            u, v = path[i], path[i+1]
            attrs = dict(G[u][v])
            # safe picks
            fr = float(attrs.get("friction", 0.0))
            cost = float(attrs.get("total_cost_pct", fr))
            time_days = float(attrs.get("settlement_time_days", 0.0))
            edges.append(schemas.RouteEdge(
                from_country=u,
                to_country=v,
                friction=fr,
                total_cost_pct=cost,
                settlement_time_days=time_days,
                metadata={k: attrs.get(k) for k in ["corridor_volume_musd", "withholding_tax_amount_musd"] if k in attrs}
            ))
            total_cost += cost
            total_time += time_days
            total_risk += fr  # or use risk fields if separate
        # compute composite score via your scoring util
        weights = req.weights or {"cost": 0.6, "time": 0.2, "risk": 0.2}
        composite = score_route_summary({"total_cost":total_cost, "total_time":total_time, "total_risk":total_risk}, weights["cost"], weights["time"], weights["risk"])
        results.append({
            "path":path,
            "edges":edges,
            "total_cost":total_cost,
            "total_time":total_time,
            "total_risk":total_risk,
            "composite_score":composite
        })
    return results

@app.post("/explain-edge")
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

@app.post("/reload-graph")
def reload_graph():
    get_graph(reload=True)
    return {"status": "reloaded"}

# run with: uvicorn api.main:app --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=False)
