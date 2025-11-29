# save as check_data.py and run: python check_data.py
import pandas as pd
import numpy as np
import joblib
import os, sys

TRAIN = "data/processed/rpw_train.csv"
VALID = "data/processed/rpw_valid.csv"
PREP = "models/preprocessor.pkl"

def quick_info(df, name):
    print(f"\n=== {name} ===")
    print("shape:", df.shape)
    print("columns (first 20):", df.columns.tolist()[:20])
    print("dtypes:")
    print(df.dtypes.value_counts())
    print("nulls per column (top 10):")
    print(df.isnull().sum().sort_values(ascending=False).head(10))
    print("target stats (if 'friction_score' present):")
    if "friction_score" in df.columns:
        print(df["friction_score"].describe())
    else:
        print(" - friction_score NOT FOUND")

def check_numeric_only(df, name):
    # SageMaker XGBoost expects numeric features for CSV input (no strings)
    non_numeric = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]
    if non_numeric:
        print(f"[ERROR] {name} has non-numeric columns ({len(non_numeric)}). Examples:", non_numeric[:10])
        return False
    print(f"[OK] {name} all columns numeric.")
    return True

def main():
    missing = []
    for f in (TRAIN, VALID):
        if not os.path.exists(f):
            missing.append(f)
    if missing:
        print("Missing files:", missing)
        sys.exit(1)

    # load
    df_train = pd.read_csv(TRAIN)
    df_valid = pd.read_csv(VALID)

    quick_info(df_train, "TRAIN")
    quick_info(df_valid, "VALID")

    # basic sanity
    if df_train.shape[1] != df_valid.shape[1]:
        print("[WARN] train/valid have different number of columns.")
    else:
        print("[OK] train/valid have same number of columns:", df_train.shape[1])

    # check friction target present in both
    for df,name in [(df_train,"TRAIN"), (df_valid,"VALID")]:
        if "friction_score" not in df.columns:
            print(f"[ERROR] friction_score missing in {name}")
        else:
            # check reasonable distribution
            qs = df["friction_score"].quantile([0.01,0.05,0.25,0.5,0.75,0.95,0.99])
            print(f"{name} friction_score quantiles:\n{qs}")

    # check numeric-only
    ok1 = check_numeric_only(df_train, "TRAIN")
    ok2 = check_numeric_only(df_valid, "VALID")

    # check for extreme outliers (optional)
    print("\nChecking for extreme outliers in numeric columns (values > 1e6 or < -1e6):")
    for df,name in [(df_train,"TRAIN"), (df_valid,"VALID")]:
        cols = df.select_dtypes(include=[np.number]).columns
        large = (df[cols].abs() > 1e6).any()
        bad = large[large].index.tolist()
        print(f"{name} extreme cols:", bad)

    # try to load preprocessor
    if os.path.exists(PREP):
        try:
            p = joblib.load(PREP)
            print("\n[OK] Loaded preprocessor:", PREP)
            print(" - Preprocessor type:", type(p))
        except Exception as e:
            print("\n[ERROR] Could not load preprocessor.pkl:", e)
    else:
        print("\n[WARN] preprocessor.pkl not found at models/preprocessor.pkl")

    # final verdict
    if ok1 and ok2 and "friction_score" in df_train.columns and "friction_score" in df_valid.columns:
        print("\nFINAL: Basic checks passed. Files look ready for XGBoost training.")
    else:
        print("\nFINAL: Some checks failed. Inspect errors above and fix before training.")

if __name__ == '__main__':
    main()
