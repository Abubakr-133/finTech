# routing/path_finder.py
"""
Path finding helpers for the routing engine.

Functions:
- top_k_paths(G, source, target, k=3, max_hops=4)
- path_edges(G, path)
- path_total_friction(G, path)
- path_breakdown(G, path)

Usage:
    from routing.path_finder import top_k_paths, path_breakdown
    paths = top_k_paths(G, "India", "United States", k=3)
    breakdown = path_breakdown(G, paths[0])
"""

from typing import List, Dict, Any
import networkx as nx


def top_k_paths(G: nx.DiGraph, source: str, target: str, k: int = 3, max_hops: int = 4) -> List[List[str]]:
    """
    Return up to k simple paths from source -> target ordered by summed 'friction' (lowest first).
    Falls back to all_simple_paths sorted by friction if shortest_simple_paths fails.
    """
    if source not in G or target not in G:
        return []

    paths = []
    try:
        gen = nx.shortest_simple_paths(G, source, target, weight="friction")
        for p in gen:
            if len(paths) >= k:
                break
            if (len(p) - 1) <= max_hops:
                paths.append(p)
    except Exception:
        # fallback: enumerate all simple paths up to max_hops and sort by friction
        allp = list(nx.all_simple_paths(G, source, target, cutoff=max_hops))
        allp_sorted = sorted(allp, key=lambda p: path_total_friction(G, p))
        paths = allp_sorted[:k]
    return paths


def path_edges(G: nx.DiGraph, path: List[str]) -> List[Dict[str, Any]]:
    """
    Return list of dictionaries representing edges in the path:
    [{'from': u, 'to': v, 'attrs': { ... }}, ...]
    """
    edges = []
    for u, v in zip(path[:-1], path[1:]):
        attrs = dict(G[u][v])
        edge = {"from": u, "to": v, **attrs}
        edges.append(edge)
    return edges


def path_total_friction(G: nx.DiGraph, path: List[str]) -> float:
    """
    Sum 'friction' across edges in the path. Missing friction defaults to a proxy computed from edge attrs.
    """
    total = 0.0
    for u, v in zip(path[:-1], path[1:]):
        attr = G[u][v]
        friction = attr.get("friction", None)
        if friction is None:
            # proxy: fx_spread_bps/100 + transfer_fee_percent + tax_rate_percent/100
            fx = attr.get("fx_spread_bps", 0.0) / 100.0
            fee = attr.get("transfer_fee_percent", 0.0)
            tax = attr.get("tax_rate_percent", 0.0) / 100.0
            friction = fx + fee + tax
        total += float(friction)
    return float(total)


def path_breakdown(G: nx.DiGraph, path: List[str]) -> Dict[str, Any]:
    """
    Returns a breakdown dict with:
    - edges: list of per-edge dicts (from, to, fx_spread_bps, transfer_fee_percent, tax_rate_percent,
             friction, time_days, cost_estimate, etc.)
    - total_cost: sum of cost estimates across edges
    - total_time: sum of settlement_time_days across edges
    - total_risk: sum of friction values across edges
    """
    edges_info = []
    total_cost = 0.0
    total_time = 0.0
    total_risk = 0.0

    for u, v in zip(path[:-1], path[1:]):
        attr = dict(G[u][v])

        fx_spread_bps = float(attr.get("fx_spread_bps", 0.0))
        transfer_fee_percent = float(attr.get("transfer_fee_percent", 0.0))
        tax_rate_percent = float(attr.get("tax_rate_percent", 0.0))
        settlement_time_days = float(attr.get("settlement_time_days", 0.0))
        friction = float(attr.get("friction", path_total_friction(G, [u, v])))

        # Simple cost proxy (adjust as needed)
        cost_estimate = fx_spread_bps / 100.0 + transfer_fee_percent + (tax_rate_percent / 100.0)

        edge_dict = {
            "from": u,
            "to": v,
            "fx_spread_bps": fx_spread_bps,
            "transfer_fee_percent": transfer_fee_percent,
            "tax_rate_percent": tax_rate_percent,
            "settlement_time_days": settlement_time_days,
            "friction": friction,
            "cost_estimate": cost_estimate,
        }

        # include other available attributes for transparency
        for extra_key in ("corridor_volume_musd", "compliance_regulatory_score", "sovereign_geopolitical_score",
                          "volatility_index", "market_infrastructure_score", "currency_convertibility",
                          "capital_controls", "payment_system_efficiency", "network_depth", "corridor_stability_score"):
            if extra_key in attr:
                edge_dict[extra_key] = attr.get(extra_key)

        edges_info.append(edge_dict)
        total_cost += cost_estimate
        total_time += settlement_time_days
        total_risk += friction

    return {
        "path": path,
        "edges": edges_info,
        "total_cost": float(total_cost),
        "total_time": float(total_time),
        "total_risk": float(total_risk),
        "hops": max(0, len(path) - 1)
    }


# quick demo when running directly
if __name__ == "__main__":
    # minimal smoke test (requires a graph to be built)
    try:
        from graph_builder import build_graph
        G = build_graph()
        nodes = list(G.nodes())
        if len(nodes) >= 2:
            s = nodes[0]
            t = nodes[-1]
            print("Sample source:", s, "target:", t)
            paths = top_k_paths(G, s, t, k=3)
            print("Found paths:", paths)
            if paths:
                bd = path_breakdown(G, paths[0])
                print("Breakdown:", bd)
        else:
            print("Graph has <2 nodes.")
    except Exception as e:
        print("Demo skipped; graph build failed:", e)
