# routing/graph_builder.py
"""
Builds a directed NetworkX graph from a corridor CSV.
Each edge contains raw corridor attributes and model-predicted metrics:
  - friction
  - total_cost_pct
  - settlement_time_days

Behavior:
- If a cached CSV (data/processed/corridor_with_preds.csv) exists and predict_edges=True,
  it will load predictions from that file.
- Otherwise, it will compute predictions (vectorized when possible), save cache, and build graph.

Usage:
    from routing.graph_builder import build_graph
    G = build_graph("data/raw/corridor_friction_35_countries_merged.csv", predict_edges=True)
"""

import os
import sys
from functools import lru_cache
from typing import Optional

# ensure project root on path (so relative imports inside package work)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import networkx as nx

# Try importing inference utilities. If package import fails, try local import fallback.
try:
    import inference
except Exception:
    try:
        # allow running the file directly during development
        import inference
    except Exception as e:
        raise ImportError("Could not import routing.inference module. Make sure routing package is on PYTHONPATH.") from e

# Default file paths
DEFAULT_RAW_CSV = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "corridor_friction_35_countries_merged.csv")
PROCESSED_CACHE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed", "corridor_with_preds.csv")


@lru_cache(maxsize=1)
def build_graph(corridor_csv: Optional[str] = None, predict_edges: bool = True, cache_csv: bool = True) -> nx.DiGraph:
    """
    Build and return a directed graph G where:
      - nodes = countries (source_country, destination_country)
      - edges have attributes from the CSV plus predicted metrics (friction, total_cost_pct, settlement_time_days)

    Parameters
    ----------
    corridor_csv : str or None
        Path to the raw corridor CSV file. If None, DEFAULT_RAW_CSV used.
    predict_edges : bool
        If True, compute model predictions for each edge (or read cached predictions).
    cache_csv : bool
        If True, save vectorized predictions to PROCESSED_CACHE for reuse.

    Returns
    -------
    G : networkx.DiGraph
    """
    if corridor_csv is None:
        corridor_csv = DEFAULT_RAW_CSV

    if not os.path.exists(corridor_csv):
        raise FileNotFoundError(f"Corridor CSV not found: {corridor_csv}")

    # ensure processed folder exists
    os.makedirs(os.path.dirname(PROCESSED_CACHE), exist_ok=True)

    df = pd.read_csv(corridor_csv)
    df_columns_before = set(df.columns.tolist())

    # If prediction caching exists, load it (and verify it has the expected pred columns)
    if predict_edges and os.path.exists(PROCESSED_CACHE):
        try:
            df_cached = pd.read_csv(PROCESSED_CACHE)
            # expected pred columns
            if {"friction", "total_cost_pct", "settlement_time_days"}.issubset(set(df_cached.columns)):
                # quick heuristic: ensure same number of rows or same unique corridor ids
                if len(df_cached) == len(df):
                    df = df_cached
                else:
                    # try to merge predictions by key columns if available (source/destination)
                    key_cols = ["source_country", "destination_country"]
                    if all(k in df_cached.columns for k in key_cols) and all(k in df.columns for k in key_cols):
                        df = df.merge(df_cached[[*key_cols, "friction", "total_cost_pct", "settlement_time_days"]],
                                      on=key_cols, how="left")
                        # if any preds missing fill later
                    else:
                        # fall through to recompute predictions
                        pass
            # else fall through to recompute
        except Exception:
            # corrupted cache — recompute
            pass

    # If predictions are required and not present, compute them
    if predict_edges and ({"friction", "total_cost_pct", "settlement_time_days"} - set(df.columns)):
        print("Computing edge predictions (vectorized if possible)...")

        # Prefer vectorized path: use inference._engineer_features if available to produce a features DataFrame
        try:
            # build engineered rows using internal helper if available
            if hasattr(inference, "_engineer_features"):
                engineered = []
                for _, row in df.iterrows():
                    # produce a dict of engineered features for this row
                    eng = inference._engineer_features(row.to_dict())
                    # only keep keys that are in FEATURE_NAMES to build a consistent DF
                    # FEATURE_NAMES is expected to be defined in inference
                    row_ordered = {k: eng.get(k, 0.0) for k in inference.FEATURE_NAMES}
                    engineered.append(row_ordered)
                feat_df = pd.DataFrame(engineered, columns=inference.FEATURE_NAMES)

                # transform full matrix using preprocessor (vectorized)
                X_scaled = inference.preprocessor.transform(feat_df)
                # Build DMatrix and predict using boosters
                dmat = xgb_DMatrix_safe(X_scaled, inference.FEATURE_NAMES)

                # use boosters from inference module
                pred_friction = inference.bst_friction.predict(dmat)
                pred_cost = inference.bst_cost.predict(dmat)
                pred_time = inference.bst_time.predict(dmat)

                # assign predictions to df
                df["friction"] = pred_friction
                df["total_cost_pct"] = pred_cost
                df["settlement_time_days"] = pred_time
                print("Vectorized predictions complete.")
            else:
                # vectorized helper not available — fallback to per-row predict_edge_metrics
                raise AttributeError("inference._engineer_features not found; falling back to per-row predictions.")
        except Exception as e:
            print("Vectorized prediction failed or not available:", str(e))
            print("Falling back to per-row predictions (slower).")
            preds = []
            for _, row in df.iterrows():
                try:
                    p = inference.predict_edge_metrics(row.to_dict())
                    preds.append(p)
                except Exception as ei:
                    # fallback proxy if prediction fails
                    fx = float(row.get("fx_spread_bps", 0.0)) / 100.0
                    fee = float(row.get("transfer_fee_percent", 0.0))
                    tax = float(row.get("tax_rate_percent", 0.0)) / 100.0
                    proxy = fx + fee + tax
                    preds.append({"friction": proxy, "total_cost_pct": proxy, "settlement_time_days": float(row.get("settlement_time_days", 0.0))})
            # expand preds into columns
            df_preds = pd.DataFrame(preds)
            df = pd.concat([df.reset_index(drop=True), df_preds.reset_index(drop=True)], axis=1)

        # optionally cache processed CSV for faster subsequent startup
        if cache_csv:
            try:
                df.to_csv(PROCESSED_CACHE, index=False)
                print("Saved processed corridor_with_preds.csv to:", PROCESSED_CACHE)
            except Exception as e:
                print("Warning: failed to write processed cache:", e)

    # Build NetworkX DiGraph
    G = nx.DiGraph()
    for idx, row in df.iterrows():
        src = str(row.get("source_country", "")).strip()
        dst = str(row.get("destination_country", "")).strip()
        if src == "" or dst == "":
            continue

        # Base attributes to carry forward (keep original columns for transparency)
        attrs = {}
        for c in df.columns:
            # avoid huge objects; cast floats/ints/strings only
            val = row[c]
            # pandas types -> native python
            if pd.isna(val):
                continue
            # store numeric as native floats/ints and strings otherwise
            if isinstance(val, (float, int)):
                attrs[c] = float(val) if (pd.api.types.is_float_dtype(type(val)) or isinstance(val, float)) else int(val)
            else:
                try:
                    # try to convert to float if numeric-like string
                    fv = float(val)
                    attrs[c] = fv
                except Exception:
                    attrs[c] = val

        # Ensure predicted columns exist (fill from proxy if missing)
        if "friction" not in attrs:
            fx = float(row.get("fx_spread_bps", 0.0)) / 100.0
            fee = float(row.get("transfer_fee_percent", 0.0))
            tax = float(row.get("tax_rate_percent", 0.0)) / 100.0
            attrs["friction"] = fx + fee + tax
        if "total_cost_pct" not in attrs:
            attrs["total_cost_pct"] = attrs.get("friction", 0.0)
        if "settlement_time_days" not in attrs:
            attrs["settlement_time_days"] = float(row.get("settlement_time_days", 0.0))

        # add edge
        G.add_edge(src, dst, **attrs)

    print(f"Graph built — nodes: {len(G.nodes())}, edges: {len(G.edges())}")
    return G


# -----------------------
# Helper: safe DMatrix builder (keeps feature names)
# -----------------------
def xgb_DMatrix_safe(X_scaled, feature_names):
    """
    Build an xgb.DMatrix from preprocessor output X_scaled (ndarray or DataFrame)
    and attach explicit feature_names. This pads/trims columns to match feature_names length.
    """
    import numpy as _np
    import xgboost as _xgb
    if isinstance(X_scaled, pd.DataFrame):
        X_arr = X_scaled.values
    else:
        X_arr = _np.array(X_scaled)
    if X_arr.ndim == 1:
        X_arr = X_arr.reshape(1, -1)

    expected = len(feature_names)
    actual = X_arr.shape[1]
    if actual != expected:
        if actual < expected:
            pad = _np.zeros((X_arr.shape[0], expected - actual), dtype=X_arr.dtype)
            X_arr = _np.hstack([X_arr, pad])
        else:
            X_arr = X_arr[:, :expected]
    return _xgb.DMatrix(X_arr, feature_names=feature_names)


# If run directly, quick smoke test
if __name__ == "__main__":
    print("Building graph (demo)...")
    G = build_graph(DEFAULT_RAW_CSV, predict_edges=True, cache_csv=True)
    # print first 5 edges with friction
    shown = 0
    for u, v, a in G.edges(data=True):
        print(f"{u} -> {v} | friction: {a.get('friction'):.6f} | total_cost_pct: {a.get('total_cost_pct'):.4f} | time_days: {a.get('settlement_time_days')}")
        shown += 1
        if shown >= 5:
            break
