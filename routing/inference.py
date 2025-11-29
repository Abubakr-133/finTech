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

def predict_friction(raw_row):
    """
    raw_row: dict of raw features matching the columns before scaling (i.e., the same inputs used in preprocess).
    Returns: friction (float)
    """
    feature_names, preprocessor, bst, explainer = load_model_artifacts()
    # Create df from raw_row — preprocessor expects the original FEATURE_COLS order
    X_raw = pd.DataFrame([raw_row])[feature_names]
    # transform
    X_scaled = preprocessor.transform(X_raw)
    # ensure numpy array
    dmat = xgb.DMatrix(X_scaled, feature_names=feature_names)
    # use best_iteration if available
    try:
        best_it = bst.best_iteration
        if best_it is not None:
            pred = bst.predict(dmat, iteration_range=(0, best_it + 1))[0]
        else:
            pred = bst.predict(dmat)[0]
    except Exception:
        pred = bst.predict(dmat)[0]
    return float(pred)

def explain_friction(raw_row):
    """
    Returns: dict with 'friction' and 'shap' (feature->value) for the single input
    """
    feature_names, preprocessor, bst, explainer = load_model_artifacts()
    X_raw = pd.DataFrame([raw_row])[feature_names]
    X_scaled = preprocessor.transform(X_raw)
    X_scaled_df = pd.DataFrame(X_scaled, columns=feature_names)
    # shap values
    shap_values = explainer.shap_values(X_scaled_df)
    # compute prediction
    try:
        best_it = bst.best_iteration
        if best_it is not None:
            pred = bst.predict(xgb.DMatrix(X_scaled, feature_names=feature_names), iteration_range=(0, best_it + 1))[0]
        else:
            pred = bst.predict(xgb.DMatrix(X_scaled, feature_names=feature_names))[0]
    except Exception:
        pred = bst.predict(xgb.DMatrix(X_scaled, feature_names=feature_names))[0]
    shap_dict = dict(zip(feature_names, shap_values[0].tolist()))
    return {"friction": float(pred), "shap": shap_dict}
