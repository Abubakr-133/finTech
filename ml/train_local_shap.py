# ml/train_local_shap.py
import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error
import xgboost as xgb
import shap
import matplotlib.pyplot as plt

# --- CONFIG
TRAIN_CSV = "data/rpw_train.csv"
VALID_CSV = "data/rpw_valid.csv"
FEATURE_NAMES_JSON = "models/feature_names.json"
MODEL_OUT = "models/xgb_friction.bst"          # Booster saved here
MODEL_SKLEARN_OUT = "models/xgb_friction_sklearn.pkl"  # optional sklearn wrapper if needed
SHAP_VALUES_OUT = "outputs/shap_values.csv"
SHAP_SUMMARY_PNG = "outputs/shap_summary.png"
SHAP_MEAN_CSV = "outputs/shap_mean_importance.csv"
TARGET = "friction_score"

os.makedirs("models", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

# --- LOAD DATA
print("Loading processed train/valid CSVs...")
train = pd.read_csv(TRAIN_CSV)
valid = pd.read_csv(VALID_CSV)

# --- LOAD feature names and assign to columns
print("Loading feature names...")
with open(FEATURE_NAMES_JSON, "r") as f:
    feature_names = json.load(f)

expected_col_count = len(feature_names) + 1
if train.shape[1] != expected_col_count:
    raise ValueError(f"Train CSV columns ({train.shape[1]}) != expected ({expected_col_count}). Check preprocessing output.")
if valid.shape[1] != expected_col_count:
    raise ValueError(f"Valid CSV columns ({valid.shape[1]}) != expected ({expected_col_count}). Check preprocessing output.")

new_cols = feature_names + [TARGET]
train.columns = new_cols
valid.columns = new_cols

X_train = train[feature_names].values
y_train = train[TARGET].values
X_valid = valid[feature_names].values
y_valid = valid[TARGET].values

# --- TRAIN using xgboost.train (Booster) with early stopping
print("Training XGBoost Booster with xgboost.train ...")

dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=feature_names)
dval = xgb.DMatrix(X_valid, label=y_valid, feature_names=feature_names)

params = {
    "objective": "reg:squarederror",
    "eval_metric": "rmse",
    "eta": 0.05,
    "max_depth": 6,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    # "tree_method": "hist"  # uncomment if supported and helpful
}

num_round = 1000
evallist = [(dtrain, "train"), (dval, "validation")]

bst = xgb.train(
    params,
    dtrain,
    num_boost_round=num_round,
    evals=evallist,
    early_stopping_rounds=30,
    verbose_eval=50
)

# --- SAVE BOOSTER
bst.save_model(MODEL_OUT)
print(f"Saved Booster model -> {MODEL_OUT}")

# Optional: wrap Booster in sklearn wrapper and save (useful if you want sklearn API later)
try:
    sk_model = xgb.XGBRegressor()
    sk_model._Booster = bst
    sk_model._le = None
    joblib.dump(sk_model, MODEL_SKLEARN_OUT)
    print(f"Saved sklearn-wrapped model -> {MODEL_SKLEARN_OUT}")
except Exception:
    print("Skipping sklearn wrapper save (not critical).")

# --- EVALUATE
y_pred = bst.predict(dval, ntree_limit=bst.best_ntree_limit if hasattr(bst,'best_ntree_limit') else None)
rmse = mean_squared_error(y_valid, y_pred, squared=False)
mae = mean_absolute_error(y_valid, y_pred)
print(f"Validation RMSE: {rmse:.6f}")
print(f"Validation MAE : {mae:.6f}")

# --- SHAP EXPLAINABILITY
print("Computing SHAP values (TreeExplainer supports Booster)...")
explainer = shap.TreeExplainer(bst)
X_valid_df = pd.DataFrame(X_valid, columns=feature_names)

# compute shap values for validation set (may be slow if large)
shap_values = explainer.shap_values(X_valid_df)  # shape: (n_samples, n_features)

# Save per-sample SHAP values
shap_df = pd.DataFrame(shap_values, columns=feature_names)
shap_df[TARGET] = y_valid
shap_df["pred"] = y_pred
shap_df.to_csv(SHAP_VALUES_OUT, index=False)
print(f"Saved per-sample SHAP values → {SHAP_VALUES_OUT}")

# Mean absolute SHAP importance
mean_abs_shap = np.abs(shap_values).mean(axis=0)
mean_df = pd.DataFrame({"feature": feature_names, "mean_abs_shap": mean_abs_shap})
mean_df = mean_df.sort_values("mean_abs_shap", ascending=False)
mean_df.to_csv(SHAP_MEAN_CSV, index=False)
print(f"Saved mean |SHAP| importance → {SHAP_MEAN_CSV}")

# SHAP summary plot (bar)
print("Saving SHAP summary plot...")
plt.figure(figsize=(8, max(6, len(feature_names)*0.15)))
shap.summary_plot(shap_values, X_valid_df, show=False, plot_type="bar", max_display=30)
plt.tight_layout()
plt.savefig(SHAP_SUMMARY_PNG, dpi=150, bbox_inches="tight")
plt.close()
print(f"Saved SHAP summary plot → {SHAP_SUMMARY_PNG}")

# Optional beeswarm (may fail on headless)
try:
    plt.figure(figsize=(10,6))
    shap.summary_plot(shap_values, X_valid_df, show=False, max_display=30)
    beeswarm_path = SHAP_SUMMARY_PNG.replace(".png", "_beeswarm.png")
    plt.tight_layout()
    plt.savefig(beeswarm_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved SHAP beeswarm plot → {beeswarm_path}")
except Exception as e:
    print("Beeswarm plot failed (likely headless). Error:", e)

print("DONE.")
