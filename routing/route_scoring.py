# routing/route_scoring.py
"""
Route scoring utilities.

Primary function:
- composite_score(breakdown, w_cost=0.6, w_time=0.2, w_risk=0.2)

This returns a numeric score (lower = better) combining average cost, time and risk
across the path. It normalizes by hops to keep comparability between paths of different lengths.
"""

from typing import Dict


def composite_score(breakdown: Dict, w_cost: float = 0.6, w_time: float = 0.2, w_risk: float = 0.2) -> float:
    """
    Compute composite score for a route given a breakdown dict (as returned by path_breakdown).

    We normalize weights if they don't sum to 1.

    Parameters
    ----------
    breakdown : Dict
        Must contain keys: 'total_cost', 'total_time', 'total_risk', 'hops'
    w_cost, w_time, w_risk : floats
        Weights for each component. Preferably sum to 1.

    Returns
    -------
    float : lower = better
    """
    # normalize weights
    total_w = w_cost + w_time + w_risk
    if total_w <= 0:
        w_cost, w_time, w_risk = 0.6, 0.2, 0.2
    else:
        w_cost, w_time, w_risk = w_cost / total_w, w_time / total_w, w_risk / total_w

    # Optionally apply simple scaling to bring components to comparable magnitude.
    # These scaling constants can be tuned per dataset; keep simple for the hackathon.
    cost_scale = 1.0
    time_scale = 1.0
    risk_scale = 1.0
    
    total_cost = breakdown.get("total_cost", 0.0)
    total_time = breakdown.get("total_time", 0.0)
    total_risk = breakdown.get("total_risk", 0.0)
    score = w_cost * (total_cost * cost_scale) + w_time * (total_time * time_scale) + w_risk * (total_risk * risk_scale)
    return float(score)


# convenience wrapper that returns a scored summary
def score_route_summary(breakdown: Dict, w_cost: float = 0.6, w_time: float = 0.2, w_risk: float = 0.2) -> Dict:
    score = composite_score(breakdown, w_cost=w_cost, w_time=w_time, w_risk=w_risk)
    return {
        "path": breakdown.get("path"),
        "hops": breakdown.get("hops"),
        "totqal_cost": breakdown.get("total_cost"),
        "total_time": breakdown.get("total_time"),
        "total_risk": breakdown.get("total_risk"),
        "composite_score": score
    }


# quick demo
if __name__ == "__main__":
    sample_breakdown = {
        "path": ["IN", "SG", "US"],
        "total_cost": 3.5,
        "total_time": 2.0,
        "total_risk": 0.45,
        "hops": 2
    }
    print(score_route_summary(sample_breakdown, w_cost=0.6, w_time=0.2, w_risk=0.2))
