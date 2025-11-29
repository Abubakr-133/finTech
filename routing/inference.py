# routing/inference.py
"""
Robust inference helpers.

- Loads preprocessor + feature_names.
- Tries to load boosters for friction/cost/time but will not raise if any are missing.
- predict_edge_metrics(raw_row) returns available predictions and falls back to proxies when necessary.
- explain_edge_metrics works only for targets whose boosters are loaded.
"""

import os
import sys
import json
from typing import Dict, Tuple, Optional
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

# allow running from module or direct file
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(ROOT, "models")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.pkl")
FEATURES_PATH = os.path.join(MODELS_DIR, "feature_names.json")

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
    if isinstance(X_scaled, pd.DataFrame):
        X_arr = X_scaled.values
    else:
        X_arr = np.array(X_scaled)
    if X_arr.ndim == 1:
        X_arr = X_arr.reshape(1, -1)
    expected = len(FEATURE_NAMES)
    actual = X_arr.shape[1]
    if actual != expected:
        if actual < expected:
            pad = np.zeros((X_arr.shape[0], expected - actual), dtype=X_arr.dtype)
            X_arr = np.hstack([X_arr, pad])
        else:
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
def predict_edge_metrics(raw_row: Dict) -> Dict[str, float]:
    """
    Returns dict with keys:
      - friction  (float)
      - total_cost_pct (float)
      - settlement_time_days (float)

    Uses ML if boosters available; falls back to proxy calculations if not.
    """
    # prepare features
    row_df = prepare_row(raw_row)
    X_scaled = preprocessor.transform(row_df)
    dmat = _build_dmatrix_from_scaled(X_scaled)

    out = {}

    # friction
    if bst_friction is not None:
        try:
            out["friction"] = _booster_predict_single(bst_friction, dmat)
        except Exception:
            out["friction"] = None
    else:
        out["friction"] = None

    # cost
    if bst_cost is not None:
        try:
            out["total_cost_pct"] = _booster_predict_single(bst_cost, dmat)
        except Exception:
            out["total_cost_pct"] = None
    else:
        out["total_cost_pct"] = None

    # time
    if bst_time is not None:
        try:
            out["settlement_time_days"] = _booster_predict_single(bst_time, dmat)
        except Exception:
            out["settlement_time_days"] = None
    else:
        out["settlement_time_days"] = None

    # fill missing predictions with reasonable proxies
    # proxy cost: fx_spread_bps/100 + transfer_fee_percent + tax_rate_percent/100
    if out.get("total_cost_pct") is None:
        fx = float(raw_row.get("fx_spread_bps", 0.0)) / 100.0
        fee = float(raw_row.get("transfer_fee_percent", 0.0))
        tax = float(raw_row.get("tax_rate_percent", 0.0)) / 100.0
        out["total_cost_pct"] = fx + fee + tax

    # proxy settlement_time_days: use raw column if present or default 3
    if out.get("settlement_time_days") is None:
        out["settlement_time_days"] = float(raw_row.get("settlement_time_days", raw_row.get("transfer_time_estimate_days", 3.0)))

    # proxy friction: if missing, use cost proxy
    if out.get("friction") is None:
        out["friction"] = out["total_cost_pct"]

    return out

# SHAP explanation only if booster exists
def explain_edge_metrics(raw_row: Dict, target: str = "friction", max_display: int = 10):
    """
    Returns (pred_value, shap_df) for the requested target.
    Raises ValueError if the booster for target isn't loaded.
    """
    tgt = target.lower()
    if tgt in ("friction", "fric"):
        booster = bst_friction
    elif tgt in ("cost", "total_cost_pct"):
        booster = bst_cost
    elif tgt in ("time", "settlement_time_days"):
        booster = bst_time
    else:
        raise ValueError("Invalid target for explain_edge_metrics")

    if booster is None:
        raise ValueError(f"Model for target '{target}' is not available.")

    row_df = prepare_row(raw_row)
    X_scaled = preprocessor.transform(row_df)
    dmat = _build_dmatrix_from_scaled(X_scaled)

    explainer = shap.TreeExplainer(booster)
    shap_vals = explainer.shap_values(dmat)[0]
    pred = _booster_predict_single(booster, dmat)

    shap_df = pd.DataFrame({"feature": FEATURE_NAMES, "shap_value": shap_vals})
    shap_df["abs_shap"] = shap_df["shap_value"].abs()
    shap_df = shap_df.sort_values("abs_shap", ascending=False).head(max_display).drop(columns=["abs_shap"]).reset_index(drop=True)

    return float(pred), shap_df

# quick info when imported
if __name__ == "__main__":
    print("Models available:", models_available())
