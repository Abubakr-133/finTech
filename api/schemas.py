# api/schemas.py
from pydantic import BaseModel
from typing import List, Dict, Optional

class PredictEdgeRequest(BaseModel):
    source_country: str
    destination_country: str
    features: Optional[Dict[str, float]] = None   # raw row if frontend passes it

class PredictEdgeResponse(BaseModel):
    friction: float
    total_cost_pct: float
    settlement_time_days: float

class RouteRequest(BaseModel):
    source: str
    destination: str
    amount: Optional[float] = None
    weights: Optional[Dict[str, float]] = {"cost": 0.6, "time": 0.2, "risk": 0.2}
    max_hops: Optional[int] = 3
    k: Optional[int] = 3

class RouteEdge(BaseModel):
    from_country: str
    to_country: str
    friction: float
    total_cost_pct: float
    settlement_time_days: float
    metadata: Optional[Dict] = None

# class RouteResponse(BaseModel):
#     path: List[str]
#     edges: List[RouteEdge]
#     total_cost: float
#     total_time: float
#     total_risk: float
#     composite_score: float

class ExplainEdgeRequest(BaseModel):
    source_country: str
    destination_country: str
    target: Optional[str] = "friction"  # friction | cost | time

class HealthResponse(BaseModel):
    status: str
    models_loaded: Dict[str, bool]
    nodes: int
    edges: int
