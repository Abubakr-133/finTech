# routing/inference.py
"""
Inference module with multi-target predictions and SHAP explainability.
Exposes:
- predict_edge_metrics(raw_row) -> {'friction','total_cost_pct','settlement_time_days'}
- explain_edge(raw_row, target) -> (pred, shap_df, summary_dict)
- explain_route(path_edges, top_n=5) -> aggregated explanation for a multi-hop path
"""

import os
import sys
import json
from typing import Dict, Tuple, Optional
import joblib
import numpy as np
import pandas as pd

# ensure package path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import xgboost as xgb

# local shap utilities
from ml.shap_utils import load_explainers, explain_row, summarize_shap_df, save_force_plot_single

# Paths
ROOT = os.path.dirname(os.path.dirname(__file__))
MODELS_DIR = os.path.join(ROOT, "models")
FEATURES_PATH = os.path.join(MODELS_DIR, "feature_names.json")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.pkl")

# load artifacts via shap_utils loader
_artifacts = load_explainers()
preprocessor = _artifacts["preprocessor"]
FEATURE_NAMES = _artifacts["feature_names"]
_boosters = _artifacts["boosters"]   # dict of Booster objects
_explainers = _artifacts["explainers"]

# model filenames (update if yours differ)
BST_FRICTION_PATH = os.path.join(MODELS_DIR, "xgb_friction.bst")
BST_COST_PATH = os.path.join(MODELS_DIR, "xgb_cost.bst")
BST_TIME_PATH = os.path.join(MODELS_DIR, "xgb_time.bst")

# load preprocessor & feature names (required)
if not os.path.exists(PREPROCESSOR_PATH):
    raise FileNotFoundError(f"Preprocessor not found: {PREPROCESSOR_PATH}")
preprocessor = joblib.load(PREPROCESSOR_PATH)

if not os.path.exists(FEATURES_PATH):
    raise FileNotFoundError(f"Feature names not found: {FEATURES_PATH}")
with open(FEATURES_PATH, "r") as f:
    FEATURE_NAMES = json.load(f)

# helper to try load boosters; don't raise if missing
def _try_load_booster(path: str) -> Optional[xgb.Booster]:
    if not os.path.exists(path):
        return None
    try:
        booster = xgb.Booster()
        booster.load_model(path)
        return booster
    except Exception as e:
        print(f"Warning: failed loading booster {path}: {e}")
        return None

bst_friction = _try_load_booster(BST_FRICTION_PATH)
bst_cost = _try_load_booster(BST_COST_PATH)
bst_time = _try_load_booster(BST_TIME_PATH)

def models_available() -> Dict[str, bool]:
    return {
        "friction": bst_friction is not None,
        "cost": bst_cost is not None,
        "time": bst_time is not None
    }

# -------------------------
# Minimal feature engineering (must match your preprocess)
# -------------------------
def _engineer_features(row: Dict) -> Dict:
    r = dict(row)
    def _get(k, default=0.0):
        v = r.get(k, default)
        try:
            return float(v)
        except Exception:
            return default

    # fx_cost_pct from bps -> %
    if "fx_cost_pct" not in r:
        if "fx_spread_bps" in r:
            r["fx_cost_pct"] = _get("fx_spread_bps") / 10000.0 * 100.0
        else:
            r["fx_cost_pct"] = 0.0

    if "fee_cost_pct" not in r:
        r["fee_cost_pct"] = _get("transfer_fee_percent", 0.0)

    if "tax_cost_pct" not in r:
        r["tax_cost_pct"] = _get("tax_rate_percent", 0.0)

    if "risk_composite" not in r:
        vals = []
        for k in ("compliance_regulatory_score", "sovereign_geopolitical_score", "volatility_index"):
            if k in r:
                vals.append(_get(k))
        r["risk_composite"] = float(np.mean(vals)) / 100.0 if vals else 0.0

    # treaty friction
    if "treaty_friction" not in r:
        if "has_tax_treaty" in r:
            try:
                r["treaty_friction"] = 0.0 if int(_get("has_tax_treaty")) == 1 else 1.0
            except Exception:
                r["treaty_friction"] = 1.0
        else:
            r["treaty_friction"] = 1.0

    # ensure all features exist (fill zeros)
    for feat in FEATURE_NAMES:
        if feat not in r:
            r[feat] = 0.0

    return r

def prepare_row(raw_row: Dict) -> pd.DataFrame:
    full = _engineer_features(raw_row)
    ordered = {k: full.get(k, 0.0) for k in FEATURE_NAMES}
    df = pd.DataFrame([ordered])
    for c in df.columns:
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0.0)
    return df

def _build_dmatrix_from_scaled(X_scaled) -> xgb.DMatrix:
    X_scaled = preprocessor.transform(df_ordered)
    if isinstance(X_scaled, pd.DataFrame):
        X_arr = X_scaled.values
    else:
        X_arr = np.array(X_scaled)
    if X_arr.ndim == 1:
        X_arr = X_arr.reshape(1, -1)
    expected = len(FEATURE_NAMES)
    if X_arr.shape[1] < expected:
        pad = np.zeros((1, expected - X_arr.shape[1]))
        X_arr = np.hstack([X_arr, pad])
    elif X_arr.shape[1] > expected:
        X_arr = X_arr[:, :expected]
    return xgb.DMatrix(X_arr, feature_names=FEATURE_NAMES)

def _booster_predict_single(booster: xgb.Booster, dmat: xgb.DMatrix) -> float:
    best_it = getattr(booster, "best_iteration", None)
    if best_it is not None:
        try:
            return float(booster.predict(dmat, iteration_range=(0, best_it + 1))[0])
        except Exception:
            return float(booster.predict(dmat)[0])
    return float(booster.predict(dmat)[0])

# -------------------------
# Public API
# -------------------------
def predict_edge_metrics(raw_row: dict) -> dict:
    """
    Return model-predicted metrics for a single corridor row.
    {
      'friction': float,
      'total_cost_pct': float,
      'settlement_time_days': float
    }
    """
    df = prepare_row(raw_row)
    X_scaled = preprocessor.transform(row_df)
    dmat = _build_dmatrix_from_scaled(X_scaled)

    def _pred(booster):
        best_it = getattr(booster, "best_iteration", None)
        if best_it is not None:
            return float(booster.predict(dmat, iteration_range=(0, best_it + 1))[0])
        return float(booster.predict(dmat)[0])

    pred_friction = _pred(_boosters["friction"])
    pred_cost = _pred(_boosters["cost"])
    pred_time = _pred(_boosters["time"])

    return {"friction": float(pred_friction),
            "total_cost_pct": float(pred_cost),
            "settlement_time_days": float(pred_time)}


def explain_edge_metrics(raw_row: dict, target: str = "friction", top_n: int = 8) -> dict:
    """
    Explain a single corridor (edge) prediction for the selected target.
    Returns a dict with:
    - pred: float
    - shap_table: pd.DataFrame (feature, value, shap_value) (converted to dict)
    - summary: {top_positive: [(feat, shap, value)...], top_negative: [...]}
    - optional saved_plot: path to saved force-like bar plot
    """
    pred, shap_df = explain_row(target, raw_row, _artifacts, max_display=50)
    summary = summarize_shap_df(shap_df, top_n)
    # save small bar plot for UI
    try:
        outpng = os.path.join(os.path.dirname(__file__), "..", "outputs", f"shap_{target}_single.png")
        # shap_df contains top features only; use raw explainer to get full shap values if you want
        # For simplicity, call shap_utils.save_force_plot_single analogously
        shap_vals_full = _explainers[target].shap_values(_to_dmatrix_from_preprocessed(pd.DataFrame([ {k: raw_row.get(k,0.0) for k in FEATURE_NAMES} ])))[0]
        save_force_plot_single(shap_vals_full, None, FEATURE_NAMES, outpng)
    except Exception:
        outpng = None

    return {"pred": float(pred), "shap_table": shap_df.to_dict(orient="records"), "summary": summary, "plot": outpng}


def explain_route(edge_rows: list, target: str = "friction", top_n: int = 6) -> dict:
    """
    Given a list of raw edge rows (ordered), produce aggregated SHAP explanations:
    - explains each edge individually (pred & top contributors)
    - aggregates feature-level contributions across edges and maps to percentages
    - returns a human-friendly explanation dict

    edge_rows: list of dicts [{...edge1...}, {...edge2...}, ...]
    """
    per_edge = []
    agg = {}

    for i, row in enumerate(edge_rows):
        e = explain_edge(row, target=target, top_n=top_n)
        per_edge.append({"index": i, "from_to": f"{row.get('source_country','?')}→{row.get('destination_country','?')}", **e})
        # aggregate shap contributions by feature name
        for rec in e["shap_table"]:
            feat = rec["feature"]
            shap_v = float(rec["shap_value"])
            agg[feat] = agg.get(feat, 0.0) + shap_v

    # convert agg to sorted list
    agg_list = sorted([(k, float(v)) for k, v in agg.items()], key=lambda x: abs(x[1]), reverse=True)
    total_abs = sum(abs(v) for _, v in agg_list) or 1.0
    agg_percent = [{"feature": k, "total_shap": v, "pct_of_total": float(abs(v) / total_abs * 100.0)} for k, v in agg_list]

    # top overall contributors across route
    top_overall = agg_percent[:top_n]

    # Build human readable sentences (simple templates)
    reasons = []
    for item in top_overall:
        feat = item["feature"]
        pct = round(item["pct_of_total"], 1)
        reasons.append(f"{feat} accounted for ~{pct}% of the route's {target} contribution")

    return {
        "target": target,
        "per_edge": per_edge,
        "aggregated": agg_percent,
        "top_overall": top_overall,
        "readable_reasons": reasons
    }


# quick interactive demo when run directly
if __name__ == "__main__":
    sample = {
        "source_country": "Australia",
        "destination_country": "United States",
        "corridor_volume_musd": 15518.63,
        "fx_spread_bps": 77.24,
        "transfer_fee_percent": 1.85,
        "settlement_time_days": 3.07,
        "has_tax_treaty": 0,
        "tax_rate_percent": 5.79,
        "withholding_tax_amount_musd": 898.5287,
        "compliance_regulatory_score": 37.85,
        "sovereign_geopolitical_score": 60.09,
        "volatility_index": 58.81,
        "market_infrastructure_score": 35.44,
        "currency_convertibility": 39.95,
        "capital_controls": 0.16,
        "payment_system_efficiency": 0.423,
        "network_depth": 0.38,
        "corridor_stability_score": 50.1,
    }
    print("Predict metrics:", predict_edge_metrics(sample))
    print("Explain edge (friction):", explain_edge(sample, target="friction")["summary"])
    # route explain demo with two edges
    print("Route explain:", explain_route([sample, sample], target="cost")["readable_reasons"])