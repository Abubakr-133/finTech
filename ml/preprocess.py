import pandas as pd
import numpy as np
import joblib
import json
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# -------------------------------------------------
# CONFIG
# -------------------------------------------------
RAW_DATA_PATH = "synthetic_rpw_final_fixed_settlement_risk.csv"   # your raw dataset
TRAIN_OUT = "data/rpw_train.csv"
VALID_OUT = "data/rpw_valid.csv"
PREPROCESSOR_OUT = "models/preprocessor.pkl"
FEATURE_NAMES_OUT = "models/feature_names.json"

TARGET = "friction_score"

# -------------------------------------------------
# LOAD RAW DATA
# -------------------------------------------------
print("📥 Loading dataset:", RAW_DATA_PATH)
df = pd.read_csv(RAW_DATA_PATH)
print("Original shape:", df.shape)

# -------------------------------------------------
# ENGINEERED FEATURES (Required)
# -------------------------------------------------

# ---------- FX COST ----------
if "cc1 fx margin" in df.columns:
    df["fx_cost_pct"] = df["cc1 fx margin"].astype(float)
elif "fx_margin" in df.columns:
    df["fx_cost_pct"] = df["fx_margin"].astype(float)
else:
    # fallback synthetic
    df["fx_cost_pct"] = np.random.uniform(0.1, 3.0, len(df))

# ---------- TAX COST ----------
if "withholding_tax_rate" in df.columns:
    df["tax_cost_pct"] = df["withholding_tax_rate"].astype(float)
else:
    df["tax_cost_pct"] = np.random.uniform(0.5, 15.0, len(df))

# ---------- COMPLIANCE COST NORMALIZATION ----------
if "compliance_documentation_cost" in df.columns:
    c = df["compliance_documentation_cost"]
    df["compliance_cost_norm"] = (c - c.min()) / (c.max() - c.min())
else:
    df["compliance_cost_norm"] = np.random.uniform(0, 1, len(df))

# ---------- RISK NORMALIZATION ----------
df["political_risk_norm"] = df["political_stability_index"] / 100
df["regulatory_risk_norm"] = df["regulatory_risk_score"] / 100
df["aml_risk_norm"] = df["aml_risk_index"] / 100

# ---------- TARGET VARIABLE (Friction Score) ----------
df["friction_score"] = (
    0.35 * df["fx_cost_pct"] +
    0.25 * df["tax_cost_pct"] +
    0.15 * df["regulatory_risk_norm"] +
    0.15 * df["aml_risk_norm"] +
    0.10 * df["compliance_cost_norm"]
).astype(float)

print("Engineered features added.")
print("New dataset shape:", df.shape)

# -------------------------------------------------
# FEATURE LIST FOR MODEL
# -------------------------------------------------
FEATURE_COLS = [
    "political_stability_index",
    "regulatory_quality_score",
    "rule_of_law_index",
    "government_effectiveness",
    "financial_system_development",
    "banking_sector_stability",
    "payment_system_efficiency",
    "aml_effectiveness_score",
    "tax_transparency_score",
    "reporting_requirements_index",
    "currency_convertibility_score",
    "capital_mobility_index",
    "treaty_network_density",
    "financial_sanctions_risk",
    "dispute_resolution_mechanism",
    "bilateral_tax_treaty_strength",
    "double_taxation_avoidance",
    "information_exchange_agreement",
    "jurisdictional_hops_count",
    "regulatory_domain_changes",
    "currency_conversions_count",
    "withholding_tax_rate",
    "financial_transaction_tax",
    "compliance_documentation_cost",
    "settlement_risk_index",
    "fx_cost_pct",
    "tax_cost_pct",
    "compliance_cost_norm",
    "political_risk_norm",
    "regulatory_risk_norm",
    "aml_risk_norm"
]

# -------------------------------------------------
# SELECT MODEL DATASET
# -------------------------------------------------
df_model = df[FEATURE_COLS + [TARGET]].copy()
print("ML dataset shape:", df_model.shape)

# -------------------------------------------------
# SAVE FEATURE NAMES
# -------------------------------------------------
os.makedirs("models", exist_ok=True)

with open(FEATURE_NAMES_OUT, "w") as f:
    json.dump(FEATURE_COLS, f, indent=2)

print("💾 Saved feature names →", FEATURE_NAMES_OUT)

# -------------------------------------------------
# PREPROCESSOR PIPELINE (Standard Scaler Only)
# -------------------------------------------------
pipeline = Pipeline([
    ("scaler", StandardScaler())
])

pipeline.fit(df_model[FEATURE_COLS])
joblib.dump(pipeline, PREPROCESSOR_OUT)
print("💾 Saved preprocessor →", PREPROCESSOR_OUT)

# -------------------------------------------------
# APPLY PREPROCESSING
# -------------------------------------------------
X_scaled = pipeline.transform(df_model[FEATURE_COLS])
X_scaled = pd.DataFrame(X_scaled)
X_scaled[TARGET] = df_model[TARGET].values

# -------------------------------------------------
# TRAIN/VALID SPLIT
# -------------------------------------------------
train_df, valid_df = train_test_split(
    X_scaled,
    test_size=0.20,
    random_state=42,
    shuffle=True
)

os.makedirs("data", exist_ok=True)

train_df.to_csv(TRAIN_OUT, index=False)
valid_df.to_csv(VALID_OUT, index=False)

print("💾 Saved TRAIN →", TRAIN_OUT)
print("💾 Saved VALID →", VALID_OUT)

print("\n🎉 Preprocessing COMPLETE — Ready for SageMaker Training!")
