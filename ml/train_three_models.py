# ml/train_three_models.py (robust version with sklearn-safe RMSE)
import os
import json
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import mean_squared_error, mean_absolute_error

# ---- CONFIG ----
TRAIN_CSV = "data/processed/rpw_train.csv"
VALID_CSV = "data/processed/rpw_valid.csv"
FEATURE_NAMES_JSON = "models/feature_names.json"
OUT_DIR = "models"
os.makedirs(OUT_DIR, exist_ok=True)

# canonical target names we expect (these are keys in processed CSV if present)
EXPECTED_TARGETS = {
    "friction": ["friction_score", "friction", "friction_pct"],
    "cost": ["total_cost_pct", "total_cost", "cost_pct", "cost_percent"],
    "time": ["settlement_time_days", "settlement_time", "transfer_time_estimate_days", "transfer_time_days"]
}

# XGBoost training params (tune if desired)
params = {
    "objective": "reg:squarederror",
    "eval_metric": "rmse",
    "eta": 0.05,
    "max_depth": 6,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
}

# ---- helpers ----
def find_target_column(df_cols, candidates):
    """Return first candidate column present in df_cols or None."""
    for c in candidates:
        if c in df_cols:
            return c
    return None

# ---- load data & feature names ----
print("Loading data...")
train = pd.read_csv(TRAIN_CSV)
valid = pd.read_csv(VALID_CSV)

print("Train shape:", train.shape)
print("Valid shape:", valid.shape)

with open(FEATURE_NAMES_JSON, "r") as f:
    feature_names = json.load(f)
print(f"Loaded {len(feature_names)} feature names from {FEATURE_NAMES_JSON}")

# ---- determine how features are stored in CSV ----
train_cols = list(train.columns)
valid_cols = list(valid.columns)
print("First 10 train columns:", train_cols[:10])

# Case A: train already contains feature names as column headers
if set(feature_names).issubset(set(train_cols)):
    print("Feature names match train CSV headers (good).")
    # determine which target columns exist
    available_targets = {}
    for key, cands in EXPECTED_TARGETS.items():
        col = find_target_column(train_cols, cands)
        if col:
            available_targets[key] = col
    print("Detected target columns in train CSV:", available_targets)
    if not available_targets:
        raise ValueError("No expected target columns found in train CSV. Available columns: " + ", ".join(train_cols[:30]))
    # set column order for training depending on what's present
    X_train = train[feature_names].values
    X_valid = valid[feature_names].values

# Case B: train uses positional numeric column names (0,1,2,...) or has first N columns as features
else:
    print("Feature names are NOT present as headers in train CSV.")
    if train.shape[1] >= len(feature_names) + 1:
        print("Assuming first", len(feature_names), "columns are features (positional mapping).")
        new_train_cols = feature_names + train_cols[len(feature_names):]
        new_valid_cols = feature_names + valid_cols[len(feature_names):]
        train.columns = new_train_cols[:train.shape[1]]
        valid.columns = new_valid_cols[:valid.shape[1]]
        print("Renamed train columns (positional mapping).")
        available_targets = {}
        for key, cands in EXPECTED_TARGETS.items():
            col = find_target_column(train.columns.tolist(), cands)
            if col:
                available_targets[key] = col
        print("Detected target columns after positional mapping:", available_targets)
        X_train = train[feature_names].values
        X_valid = valid[feature_names].values
    else:
        print("ERROR: Train CSV has fewer columns than number of features + targets expected.")
        print("train.shape:", train.shape)
        print("len(feature_names):", len(feature_names))
        print("train columns sample:", train_cols[:50])
        raise ValueError("Train CSV doesn't contain the expected feature columns. Check preprocess.py output.")

# Now check available_targets and decide which models to train
if not available_targets:
    raise ValueError("No recognized targets found in train CSV after mapping. Columns present: " + ", ".join(train.columns[:50]))

print("\nFinal plan: will train models for targets:", available_targets)

# For each detected target, run training
models = {}
for key, tgt_col in available_targets.items():
    print(f"\n--- Training for target '{key}' (column '{tgt_col}') ---")
    y_train = train[tgt_col].values
    y_valid = valid[tgt_col].values

    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=feature_names)
    dval = xgb.DMatrix(X_valid, label=y_valid, feature_names=feature_names)

    bst = xgb.train(
        params,
        dtrain,
        num_boost_round=1000,
        evals=[(dtrain, "train"), (dval, "valid")],
        early_stopping_rounds=30,
        verbose_eval=100
    )

    model_path = os.path.join(OUT_DIR, f"xgb_{key}.bst")
    bst.save_model(model_path)
    print("Saved model:", model_path)

    # Save sklearn wrapper for convenience (optional)
    sk_path = os.path.join(OUT_DIR, f"xgb_{key}_sk.pkl")
    try:
        sk = xgb.XGBRegressor()
        sk._Booster = bst
        joblib.dump(sk, sk_path)
        print("Saved sklearn wrapper:", sk_path)
    except Exception as e:
        print("Warning: could not save sklearn wrapper:", e)

    # Evaluate
    try:
        best_it = getattr(bst, "best_iteration", None)
        if best_it is not None:
            y_pred = bst.predict(dval, iteration_range=(0, best_it + 1))
        else:
            y_pred = bst.predict(dval)
    except Exception:
        y_pred = bst.predict(dval)

    # cross-version-safe RMSE calculation
    mse = mean_squared_error(y_valid, y_pred)
    rmse = float(np.sqrt(mse))
    mae = mean_absolute_error(y_valid, y_pred)
    print(f"Validation RMSE: {rmse:.6f}, MAE: {mae:.6f}")

    models[key] = {"bst_path": model_path, "sk_path": sk_path, "target_column": tgt_col}

# Save metadata for trained models + feature mapping
meta = {
    "feature_names": feature_names,
    "trained_models": models,
    "train_shape": train.shape,
    "valid_shape": valid.shape,
}
meta_path = os.path.join(OUT_DIR, "models_meta.json")
with open(meta_path, "w") as f:
    json.dump(meta, f, indent=2)
print("\nSaved metadata →", meta_path)
print("\nAll requested models trained and saved (for available targets).")
