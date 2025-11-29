# routing/inference.py
import json
import joblib
import xgboost as xgb
import pandas as pd
import numpy as np
import shap
from functools import lru_cache

MODEL_BST_PATH = "models/xgb_friction.bst"
PREPROCESSOR_PATH = "models/preprocessor.pkl"
FEATURE_NAMES_PATH = "models/feature_names.json"

@lru_cache(maxsize=1)
def load_model_artifacts():
    # load feature names
    with open(FEATURE_NAMES_PATH, "r") as f:
        feature_names = json.load(f)
    # load preprocessor
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    # load booster
    bst = xgb.Booster()
    bst.load_model(MODEL_BST_PATH)
    # create shap explainer (TreeExplainer works with Booster)
    explainer = shap.TreeExplainer(bst)
    return feature_names, preprocessor, bst, explainer

def _row_to_df(row_dict, feature_names):
    # row_dict: mapping of raw feature names -> values (must contain feature_names keys AFTER preprocessing)
    # We will create a DataFrame with feature_names order.
    df = pd.DataFrame([row_dict], columns=feature_names)
    return df

def predict_friction(raw_row: dict) -> float:
    """
    Robust prediction: always calls the underlying Booster with a DMatrix
    constructed using FEATURE_NAMES. Pads/trims if necessary.
    """
    row_df = prepare_row(raw_row)               # returns DF ordered as FEATURE_NAMES
    X_scaled = preprocessor.transform(row_df)   # numpy or array-like

    # ensure numpy 2D array
    if isinstance(X_scaled, pd.DataFrame):
        X_arr = X_scaled.values
    else:
        X_arr = np.array(X_scaled)

    if X_arr.ndim == 1:
        X_arr = X_arr.reshape(1, -1)

    expected = len(FEATURE_NAMES)
    actual = X_arr.shape[1]
    if actual != expected:
        print(f"[DEBUG] After transform: expected {expected} features, got {actual}. Aligning...")
        if actual < expected:
            pad = np.zeros((X_arr.shape[0], expected - actual), dtype=X_arr.dtype)
            X_arr = np.hstack([X_arr, pad])
            print(f"[DEBUG] Padded to {X_arr.shape[1]}")
        else:
            X_arr = X_arr[:, :expected]
            print(f"[DEBUG] Trimmed to {X_arr.shape[1]}")

    # Build DMatrix with exact feature names (critical)
    dmat = xgb.DMatrix(X_arr, feature_names=FEATURE_NAMES)
    booster = model.get_booster()

    # Use best_iteration when present
    try:
        if hasattr(booster, "best_iteration") and booster.best_iteration is not None:
            pred = booster.predict(dmat, iteration_range=(0, booster.best_iteration + 1))[0]
        else:
            pred = booster.predict(dmat)[0]
    except Exception as e:
        # Very last fallback — try sklearn predict but unlikely needed
        print("[WARN] Booster.predict failed:", e)
        pred = model.predict(X_arr)[0]

    return float(pred)


def explain_friction(raw_row: dict, max_display: int = 10):
    """
    Returns (prediction, shap_df) using Booster + TreeExplainer.
    """
    row_df = prepare_row(raw_row)
    X_scaled = preprocessor.transform(row_df)
    if isinstance(X_scaled, pd.DataFrame):
        X_arr = X_scaled.values
    else:
        X_arr = np.array(X_scaled)
    if X_arr.ndim == 1:
        X_arr = X_arr.reshape(1, -1)

    expected = len(FEATURE_NAMES)
    if X_arr.shape[1] != expected:
        print(f"[DEBUG] Explain: expected {expected}, got {X_arr.shape[1]}. Aligning...")
        if X_arr.shape[1] < expected:
            pad = np.zeros((X_arr.shape[0], expected - X_arr.shape[1]), dtype=X_arr.dtype)
            X_arr = np.hstack([X_arr, pad])
        else:
            X_arr = X_arr[:, :expected]

    dmat = xgb.DMatrix(X_arr, feature_names=FEATURE_NAMES)
    booster = model.get_booster()
    explainer = shap.TreeExplainer(booster)
    shap_vals = explainer.shap_values(dmat)[0]

    shap_df = pd.DataFrame({"feature": FEATURE_NAMES, "shap_value": shap_vals})
    shap_df["abs_shap"] = shap_df["shap_value"].abs()
    shap_df = shap_df.sort_values("abs_shap", ascending=False).head(max_display).drop(columns=["abs_shap"]).reset_index(drop=True)

    pred = None
    try:
        if hasattr(booster, "best_iteration") and booster.best_iteration is not None:
            pred = booster.predict(dmat, iteration_range=(0, booster.best_iteration + 1))[0]
        else:
            pred = booster.predict(dmat)[0]
    except Exception as e:
        print("[WARN] Booster.predict failed in explain_friction:", e)
        pred = model.predict(X_arr)[0]

    return float(pred), shap_df
