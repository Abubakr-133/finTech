import pandas as pd
import numpy as np
import os
import json
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# -------------------
# CONFIG
# -------------------
RAW_DATA_PATH = "data/corridor_friction_35_countries_merged.csv"

TRAIN_OUT = "data/processed/rpw_train.csv"
VALID_OUT = "data/processed/rpw_valid.csv"

PREPROCESSOR_OUT = "models/preprocessor.pkl"
FEATURE_NAMES_OUT = "models/feature_names.json"
TARGET = "friction_score"

os.makedirs("data/processed", exist_ok=True)
os.makedirs("models", exist_ok=True)

# -------------------
# LOAD DATA
# -------------------
print("📥 Loading dataset:", RAW_DATA_PATH)
df = pd.read_csv(RAW_DATA_PATH)
print("Raw shape:", df.shape)

# -------------------
# BASIC CLEANING
# -------------------
df = df.copy()
df.replace([np.inf, -np.inf], np.nan, inplace=True)
df.fillna(df.median(numeric_only=True), inplace=True)

# -------------------
# FEATURE ENGINEERING
# -------------------

# FX cost → convert bps to %
df["fx_cost_pct"] = df["fx_spread_bps"] / 10000 * 100

# Transfer fee as %
df["fee_cost_pct"] = df["transfer_fee_percent"]

# Tax cost normalized
df["tax_cost_pct"] = df["tax_rate_percent"]

df["total_cost_pct"] = df["fx_cost_pct"] + df["fee_cost_pct"] + df["tax_cost_pct"]

# Risk composite (normalize to 0–1)
risk_cols = [
    "compliance_regulatory_score",
    "sovereign_geopolitical_score",
    "volatility_index"
]

df["risk_composite"] = df[risk_cols].mean(axis=1) / 100.0

# Settlement friction normalized
df["settlement_friction"] = df["settlement_time_days"] / df["settlement_time_days"].max()

# Market + infrastructure score inverted (low infra = higher friction)
df["infra_risk"] = (100 - df["market_infrastructure_score"]) / 100

# Treaty friction (if no treaty → more friction)
df["treaty_friction"] = df["has_tax_treaty"].apply(lambda x: 0 if x == 1 else 1)

# Corridor stability inverse risk
df["stability_risk"] = (100 - df["corridor_stability_score"]) / 100

# -------------------
# FINAL TARGET: FRICTION SCORE
# Weighted composite
# -------------------
df["friction_score"] = (
    0.30 * df["fx_cost_pct"] +
    0.20 * df["fee_cost_pct"] +
    0.15 * df["tax_cost_pct"] +
    0.20 * df["risk_composite"] +
    0.10 * df["settlement_friction"] +
    0.05 * df["infra_risk"]
)

# -------------------
# SELECT FEATURES
# -------------------
FEATURE_COLS = [
    "corridor_volume_musd",
    "fx_spread_bps",
    "transfer_fee_percent",
    "settlement_time_days",
    "tax_rate_percent",
    "withholding_tax_amount_musd",
    "compliance_regulatory_score",
    "sovereign_geopolitical_score",
    "volatility_index",
    "market_infrastructure_score",
    "currency_convertibility",
    "capital_controls",
    "payment_system_efficiency",
    "network_depth",
    "corridor_stability_score",
    # engineered features
    "fx_cost_pct",
    "fee_cost_pct",
    "tax_cost_pct",
    "risk_composite",
    "settlement_friction",
    "infra_risk",
    "treaty_friction",
    "stability_risk",
    "total_cost_pct"
]

# Save feature names
with open(FEATURE_NAMES_OUT, "w") as f:
    json.dump(FEATURE_COLS, f, indent=2)

print("💾 Saved feature names →", FEATURE_NAMES_OUT)

# -------------------
# PREPROCESSING (SCALING)
# -------------------
pipeline = Pipeline([
    ("scaler", StandardScaler())
])

pipeline.fit(df[FEATURE_COLS])
joblib.dump(pipeline, PREPROCESSOR_OUT)
print("💾 Saved preprocessor →", PREPROCESSOR_OUT)

X_scaled = pipeline.transform(df[FEATURE_COLS])
X_scaled = pd.DataFrame(X_scaled, columns=FEATURE_COLS)
X_scaled["friction_score"] = df["friction_score"].values

# -------------------
# TRAIN/VALID SPLIT
# -------------------
train_df, valid_df = train_test_split(X_scaled, test_size=0.20, random_state=42)
train_df.to_csv(TRAIN_OUT, index=False)
valid_df.to_csv(VALID_OUT, index=False)

print("💾 Saved TRAIN →", TRAIN_OUT)
print("💾 Saved VALID →", VALID_OUT)

print("\n🎉 Preprocessing COMPLETE — Ready for Training!")
