# ml/train_local_shap_multi.py
import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error
import xgboost as xgb
import shap
import matplotlib.pyplot as plt

# -------------------------
# CONFIG
# -------------------------
TRAIN_CSV = "data/processed/rpw_train.csv"
VALID_CSV = "data/processed/rpw_valid.csv"
FEATURE_NAMES_JSON = "models/feature_names.json"
OUT_MODELS_DIR = "models"
OUT_DIR = "outputs"
os.makedirs(OUT_MODELS_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)

# Candidate names for each logical target (will auto-detect)
TARGET_CANDIDATES = {
    "friction": ["friction_score", "friction", "friction_pct"],
    "cost": ["total_cost_pct", "total_cost", "cost_pct", "cost_percent"],
    "time": ["settlement_time_days", "settlement_time", "transfer_time_estimate_days", "transfer_time_days"]
}

# XGBoost params (tweak if needed)
XGB_PARAMS = {
    "objective": "reg:squarederror",
    "eval_metric": "rmse",
    "eta": 0.05,
    "max_depth": 6,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
}

NUM_ROUNDS = 1000
EARLY_STOP = 30
VERBOSE_EVAL = 50  # set 0 for silent

# -------------------------
# Helpers
# -------------------------
def find_target_column(cols, candidates):
    for c in candidates:
        if c in cols:
            return c
    return None

def safe_rmse(y_true, y_pred):
    mse = mean_squared_error(y_true, y_pred)
    return float(np.sqrt(mse))

# -------------------------
# Load data + features
# -------------------------
print("Loading processed train/valid CSVs...")
train = pd.read_csv(TRAIN_CSV)
valid = pd.read_csv(VALID_CSV)

print("Loading feature names...")
with open(FEATURE_NAMES_JSON, "r") as f:
    feature_names = json.load(f)

# Basic sanity checks
print(f"Train shape: {train.shape}")
print(f"Valid shape: {valid.shape}")
print(f"Loaded {len(feature_names)} feature names.")

# Detect targets present in the CSVs
train_cols = list(train.columns)
available_targets = {}
for tgt_key, candidates in TARGET_CANDIDATES.items():
    col = find_target_column(train_cols, candidates)
    if col:
        available_targets[tgt_key] = col

if not available_targets:
    raise ValueError("No recognized target columns found in train CSV. Columns present: " + ", ".join(train_cols[:50]))

print("Detected target columns:", available_targets)

# Ensure train/valid columns are readable: either already named, or positional mapping
# If feature names exist in columns, use them; else assume first N columns are features
if set(feature_names).issubset(set(train_cols)):
    print("Feature names found in CSV headers.")
    X_train = train[feature_names].values
    X_valid = valid[feature_names].values
else:
    # positional mapping fallback
    if train.shape[1] >= len(feature_names) + 1:
        print("Feature names NOT present in headers — applying positional mapping (first N columns -> features).")
        new_train_cols = feature_names + train_cols[len(feature_names):]
        new_valid_cols = feature_names + train_cols[len(feature_names):]  # best-effort
        train.columns = new_train_cols[:train.shape[1]]
        valid.columns = new_valid_cols[:valid.shape[1]]
        X_train = train[feature_names].values
        X_valid = valid[feature_names].values
    else:
        raise ValueError("Train CSV doesn't contain enough columns to map features. Check preprocessing output.")

# -------------------------
# Train per-target
# -------------------------
trained_models_meta = {}

for tgt_key, tgt_col in available_targets.items():
    print("\n" + "="*60)
    print(f"Training target '{tgt_key}' using column '{tgt_col}'")
    y_train = train[tgt_col].values
    y_valid = valid[tgt_col].values

    # Build DMatrix
    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=feature_names)
    dval = xgb.DMatrix(X_valid, label=y_valid, feature_names=feature_names)

    # Train booster
    bst = xgb.train(
        XGB_PARAMS,
        dtrain,
        num_boost_round=NUM_ROUNDS,
        evals=[(dtrain, "train"), (dval, "valid")],
        early_stopping_rounds=EARLY_STOP,
        verbose_eval=VERBOSE_EVAL
    )

    # Save model
    model_bst_path = os.path.join(OUT_MODELS_DIR, f"xgb_{tgt_key}.bst")
    bst.save_model(model_bst_path)
    print(f"Saved Booster model -> {model_bst_path}")

    # Save sklearn wrapper (convenience; may warn on some xgboost versions)
    sk_path = os.path.join(OUT_MODELS_DIR, f"xgb_{tgt_key}_sk.pkl")
    try:
        sk = xgb.XGBRegressor()
        sk._Booster = bst
        joblib.dump(sk, sk_path)
        print(f"Saved sklearn wrapper -> {sk_path}")
    except Exception as e:
        print("Could not save sklearn wrapper:", e)
        sk_path = None

    # Predict on validation using best_iteration if present
    try:
        best_it = getattr(bst, "best_iteration", None)
        if best_it is not None:
            y_pred = bst.predict(dval, iteration_range=(0, best_it + 1))
        else:
            y_pred = bst.predict(dval)
    except Exception:
        y_pred = bst.predict(dval)

    # Evaluate (cross-version safe)
    rmse = safe_rmse(y_valid, y_pred)
    mae = mean_absolute_error(y_valid, y_pred)
    print(f"Validation RMSE: {rmse:.6f}")
    print(f"Validation MAE : {mae:.6f}")

    # Save metadata
    trained_models_meta[tgt_key] = {
        "column": tgt_col,
        "bst_path": model_bst_path,
        "sk_path": sk_path,
        "rmse": rmse,
        "mae": mae
    }

    # -------------------------
    # SHAP explainability
    # -------------------------
    try:
        print("Computing SHAP values...")
        explainer = shap.TreeExplainer(bst)
        X_valid_df = pd.DataFrame(X_valid, columns=feature_names)

        shap_values = explainer.shap_values(X_valid_df)

        # save raw shap values (may be large)
        shap_values_df = pd.DataFrame(shap_values, columns=feature_names)
        shap_values_df[tgt_col] = y_valid
        shap_values_df["pred"] = y_pred
        shp_out = os.path.join(OUT_DIR, f"shap_values_{tgt_key}.csv")
        shap_values_df.to_csv(shp_out, index=False)
        print(f"Saved SHAP values -> {shp_out}")

        # mean absolute importance
        mean_abs = np.abs(shap_values).mean(axis=0)
        mean_df = pd.DataFrame({"feature": feature_names, "mean_abs_shap": mean_abs})
        mean_df = mean_df.sort_values("mean_abs_shap", ascending=False)
        mean_out = os.path.join(OUT_DIR, f"shap_mean_importance_{tgt_key}.csv")
        mean_df.to_csv(mean_out, index=False)
        print(f"Saved SHAP mean importance -> {mean_out}")

        # summary plot
        plt.figure(figsize=(8, 10))
        shap.summary_plot(shap_values, X_valid_df, plot_type="bar", show=False)
        plt.tight_layout()
        png_out = os.path.join(OUT_DIR, f"shap_summary_{tgt_key}.png")
        plt.savefig(png_out, dpi=150, bbox_inches="tight")
        plt.close()
        print(f"Saved SHAP summary plot -> {png_out}")

    except Exception as e:
        print("SHAP computation failed for target", tgt_key, ":", e)

# Save overall metadata
meta_path = os.path.join(OUT_MODELS_DIR, "models_meta.json")
meta = {"feature_names": feature_names, "trained_models": trained_models_meta}
with open(meta_path, "w") as f:
    json.dump(meta, f, indent=2)
print("\nAll done. Metadata saved ->", meta_path)
