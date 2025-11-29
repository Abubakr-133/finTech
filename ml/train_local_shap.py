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

# --------------------------------------------------------
# CONFIG
# --------------------------------------------------------
TRAIN_CSV = "data/processed/rpw_train.csv"
VALID_CSV = "data/processed/rpw_valid.csv"
FEATURE_NAMES_JSON = "models/feature_names.json"

MODEL_OUT = "models/xgb_friction.bst"
MODEL_SKLEARN_OUT = "models/xgb_friction_sklearn.pkl"

SHAP_VALUES_OUT = "outputs/shap_values.csv"
SHAP_SUMMARY_PNG = "outputs/shap_summary.png"
SHAP_MEAN_CSV = "outputs/shap_mean_importance.csv"

TARGET = "friction_score"

# Make folders safely
os.makedirs("models", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

# --------------------------------------------------------
# LOAD DATA
# --------------------------------------------------------
print("Loading processed train/valid CSVs...")
train = pd.read_csv(TRAIN_CSV)
valid = pd.read_csv(VALID_CSV)

print("Loading feature names...")
with open(FEATURE_NAMES_JSON, "r") as f:
    feature_names = json.load(f)

expected_col_count = len(feature_names) + 1
if train.shape[1] != expected_col_count:
    raise ValueError("Train CSV column count mismatch. Check preprocessing.")
if valid.shape[1] != expected_col_count:
    raise ValueError("Valid CSV column count mismatch. Check preprocessing.")

train.columns = feature_names + [TARGET]
valid.columns = feature_names + [TARGET]

X_train = train[feature_names].values
y_train = train[TARGET].values

X_valid = valid[feature_names].values
y_valid = valid[TARGET].values

# --------------------------------------------------------
# TRAIN XGBOOST BOOSTER
# --------------------------------------------------------
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

# --------------------------------------------------------
# SAVE MODEL
# --------------------------------------------------------
bst.save_model(MODEL_OUT)
print(f"Saved Booster model → {MODEL_OUT}")

try:
    sk_model = xgb.XGBRegressor()
    sk_model._Booster = bst
    sk_model._le = None
    joblib.dump(sk_model, MODEL_SKLEARN_OUT)
    print(f"Saved sklearn-wrapped model → {MODEL_SKLEARN_OUT}")
except Exception:
    print("Skipping sklearn wrapper (not critical).")

# --------------------------------------------------------
# MODEL EVALUATION
# --------------------------------------------------------
print("Evaluating model...")

# NEW: modern iteration_range API
if hasattr(bst, "best_iteration") and bst.best_iteration is not None:
    y_pred = bst.predict(dval, iteration_range=(0, bst.best_iteration + 1))
else:
    y_pred = bst.predict(dval)

mse = mean_squared_error(y_valid, y_pred)
rmse = mse ** 0.5
mae = mean_absolute_error(y_valid, y_pred)

print(f"Validation RMSE: {rmse:.6f}")
print(f"Validation MAE : {mae:.6f}")

# --------------------------------------------------------
# SHAP EXPLAINABILITY
# --------------------------------------------------------
print("Computing SHAP values...")
explainer = shap.TreeExplainer(bst)
X_valid_df = pd.DataFrame(X_valid, columns=feature_names)

shap_values = explainer.shap_values(X_valid_df)

shap_df = pd.DataFrame(shap_values, columns=feature_names)
shap_df[TARGET] = y_valid
shap_df["pred"] = y_pred
shap_df.to_csv(SHAP_VALUES_OUT, index=False)
print(f"Saved SHAP values → {SHAP_VALUES_OUT}")

mean_abs = np.abs(shap_values).mean(axis=0)
mean_df = pd.DataFrame({"feature": feature_names, "mean_abs_shap": mean_abs})
mean_df = mean_df.sort_values("mean_abs_shap", ascending=False)
mean_df.to_csv(SHAP_MEAN_CSV, index=False)
print(f"Saved SHAP mean importance → {SHAP_MEAN_CSV}")

print("Saving SHAP summary plot...")
plt.figure(figsize=(8, 10))
shap.summary_plot(shap_values, X_valid_df, show=False, plot_type="bar", max_display=30)
plt.tight_layout()
plt.savefig(SHAP_SUMMARY_PNG, dpi=150, bbox_inches="tight")
plt.close()
print(f"Saved SHAP summary plot → {SHAP_SUMMARY_PNG}")

print("\n🎉 Training + SHAP Complete!")
