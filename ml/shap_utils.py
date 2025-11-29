# ml/shap_utils.py
"""
SHAP utilities for the Capital Routing project.

Provides:
- load_explainers(): returns tree explainers for friction/cost/time boosters
- explain_row(booster, preprocessor, feature_names, row): returns (pred, shap_df)
- summarize_shap_df(shap_df, top_n=6): readable top contributors
- save_shap_summary_plot(shap_values, X_df, outpath)
- save_force_plot_single(shap_vals_row, X_row, feature_names, outpath)

Usage:
    from ml.shap_utils import load_explainers, explain_row, summarize_shap_df
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
import shap
import matplotlib.pyplot as plt

# Do not hardcode paths if your repo differs — change these if needed.
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODELS_DIR = os.path.join(ROOT, "models")
OUT_DIR = os.path.join(ROOT, "outputs")
os.makedirs(OUT_DIR, exist_ok=True)

# default booster filenames (change if needed)
BST_PATHS = {
    "friction": os.path.join(MODELS_DIR, "xgb_friction.bst"),
    "cost": os.path.join(MODELS_DIR, "xgb_cost.bst"),
    "time": os.path.join(MODELS_DIR, "xgb_time.bst"),
}

FEATURES_PATH = os.path.join(MODELS_DIR, "feature_names.json")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.pkl")


def _load_booster(path: str) -> xgb.Booster:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Booster not found: {path}")
    b = xgb.Booster()
    b.load_model(path)
    return b


def load_explainers():
    """
    Load preprocessor, feature names and TreeExplainers for each target.
    Returns dict: {"preprocessor":..., "feature_names":..., "boosters":{...}, "explainers":{...}}
    """
    if not os.path.exists(PREPROCESSOR_PATH):
        raise FileNotFoundError(f"Preprocessor missing: {PREPROCESSOR_PATH}")
    if not os.path.exists(FEATURES_PATH):
        raise FileNotFoundError(f"Feature names missing: {FEATURES_PATH}")

    preprocessor = joblib.load(PREPROCESSOR_PATH)
    with open(FEATURES_PATH, "r") as f:
        feature_names = json.load(f)

    boosters = {}
    explainers = {}
    for key, path in BST_PATHS.items():
        boosters[key] = _load_booster(path)
        explainers[key] = shap.TreeExplainer(boosters[key])

    return {"preprocessor": preprocessor, "feature_names": feature_names,
            "boosters": boosters, "explainers": explainers}


def explain_row(target: str, raw_row: dict, artifacts: dict, max_display: int = 20):
    """
    Explain prediction for a single raw_row dict for a given target ('friction'|'cost'|'time').
    Returns: (prediction_float, shap_df (columns: feature, shap_value, value))
    - raw_row: dictionary of raw corridor columns (same as used earlier)
    - artifacts: result of load_explainers()
    """
    target = target.lower()
    if target not in artifacts["boosters"]:
        raise ValueError("target must be one of: " + ", ".join(artifacts["boosters"].keys()))

    pre = artifacts["preprocessor"]
    feature_names = artifacts["feature_names"]
    booster = artifacts["boosters"][target]
    explainer = artifacts["explainers"][target]

    # Build ordered DataFrame (assumes caller uses same engineer pipeline as preprocess)
    ordered = {k: raw_row.get(k, 0.0) for k in feature_names}
    X_df = pd.DataFrame([ordered])
    # transform using saved preprocessor (scaler/encoder pipeline)
    X_scaled = pre.transform(X_df)

    # create DMatrix with explicit feature names so Booster predict works
    if isinstance(X_scaled, pd.DataFrame):
        X_arr = X_scaled.values
    else:
        X_arr = np.array(X_scaled)
    if X_arr.ndim == 1:
        X_arr = X_arr.reshape(1, -1)

    # pad/trim just in case
    expected = len(feature_names)
    if X_arr.shape[1] < expected:
        pad = np.zeros((1, expected - X_arr.shape[1]))
        X_arr = np.hstack([X_arr, pad])
    elif X_arr.shape[1] > expected:
        X_arr = X_arr[:, :expected]

    dmat = xgb.DMatrix(X_arr, feature_names=feature_names)

    # get prediction using booster directly (use best_iteration if present)
    best_it = getattr(booster, "best_iteration", None)
    if best_it is not None:
        pred = float(booster.predict(dmat, iteration_range=(0, best_it + 1))[0])
    else:
        pred = float(booster.predict(dmat)[0])

    # SHAP values via explainer
    shap_vals = explainer.shap_values(dmat)  # returns array shape (1, n_features)
    shap_row = shap_vals[0] if isinstance(shap_vals, (list, np.ndarray)) else shap_vals

    # Build DataFrame of results
    df = pd.DataFrame({
        "feature": feature_names,
        "shap_value": shap_row,
        "abs_shap": np.abs(shap_row),
        "value": X_df.iloc[0].values
    })
    df = df.sort_values("abs_shap", ascending=False).head(max_display).reset_index(drop=True)
    df = df[["feature", "value", "shap_value"]]
    return pred, df


def summarize_shap_df(shap_df: pd.DataFrame, top_n: int = 6) -> dict:
    """
    Convert shap_df to a human readable summary:
    returns dict { 'top_positive': [(feat, val), ...], 'top_negative': [...] }
    """
    # top positive contributors (shap_value > 0 increase predicted value)
    df = shap_df.copy()
    df["shap_value"] = pd.to_numeric(df["shap_value"], errors="coerce").fillna(0.0)
    pos = df[df["shap_value"] > 0].sort_values("shap_value", ascending=False).head(top_n)
    neg = df[df["shap_value"] < 0].sort_values("shap_value").head(top_n)
    pos_list = [(r["feature"], float(r["shap_value"]), float(r["value"])) for _, r in pos.iterrows()]
    neg_list = [(r["feature"], float(r["shap_value"]), float(r["value"])) for _, r in neg.iterrows()]
    return {"top_positive": pos_list, "top_negative": neg_list}


def save_shap_summary_plot(target: str, X_df: pd.DataFrame, shap_values: np.ndarray, outname: str = None):
    """
    Save a SHAP summary bar/dot plot to outputs/.
    X_df: DataFrame of features (columns = feature_names)
    shap_values: array-like of shap values for the dataset
    outname: optional filename (inside outputs/)
    """
    if outname is None:
        outname = f"outputs/shap_summary_{target}.png"
    else:
        outname = os.path.join(OUT_DIR, outname)

    plt.figure(figsize=(8, 10))
    # shap.summary_plot accepts shap_values and X, show=False prevents display
    shap.summary_plot(shap_values, X_df, show=False, plot_type="bar", max_display=30)
    plt.tight_layout()
    plt.savefig(outname, dpi=150, bbox_inches="tight")
    plt.close()
    return outname


def save_force_plot_single(shap_vals_row, X_row, feature_names, outname: str):
    """
    Save SHAP force plot for a single sample using shap.plots.force.
    shap_vals_row: 1D array
    X_row: 1D array or pd.Series (raw feature values)
    outname: full path (PNG) to save
    """
    # shap.force_plot produces JS/HTML; use matplotlib fallback: bar chart of contributions
    df = pd.DataFrame({"feature": feature_names, "shap_value": shap_vals_row})
    df["abs_shap"] = df["shap_value"].abs()
    df = df.sort_values("abs_shap", ascending=False).head(30)

    plt.figure(figsize=(8, 6))
    # horizontal bar plot of signed shap values
    df_sorted = df.sort_values("shap_value")
    plt.barh(df_sorted["feature"].astype(str), df_sorted["shap_value"])
    plt.xlabel("SHAP value (signed contribution)")
    plt.tight_layout()
    plt.savefig(outname, dpi=150, bbox_inches="tight")
    plt.close()
    return outname