# routing/graph_builder.py
import pandas as pd
import networkx as nx
from routing.inference import predict_friction, explain_friction
from functools import lru_cache

@lru_cache(maxsize=1)
def build_graph(corridor_csv="data/raw/corridor_friction_35_countries_merged.csv", predict_edges=True):
    """
    Build directed graph G where nodes are countries and edges contain attributes:
      - friction (model prediction)
      - fx_spread_bps, transfer_fee_percent, settlement_time_days, tax_rate_percent, corridor_volume_musd, etc.
    If predict_edges=True, uses your XGBoost model to add a 'friction' float per edge.
    """
    df = pd.read_csv(corridor_csv)
    G = nx.DiGraph()
    # iterate rows and add edges
    for _, r in df.iterrows():
        src = str(r["source_country"])
        dst = str(r["destination_country"])
        attrs = {
            "corridor_volume_musd": float(r.get("corridor_volume_musd", 0)),
            "fx_spread_bps": float(r.get("fx_spread_bps", 0)),
            "transfer_fee_percent": float(r.get("transfer_fee_percent", 0)),
            "settlement_time_days": float(r.get("settlement_time_days", 0)),
            "has_tax_treaty": int(r.get("has_tax_treaty", 0)),
            "tax_rate_percent": float(r.get("tax_rate_percent", 0)),
            "withholding_tax_amount_musd": float(r.get("withholding_tax_amount_musd", 0)),
            "compliance_regulatory_score": float(r.get("compliance_regulatory_score", 0)),
            "sovereign_geopolitical_score": float(r.get("sovereign_geopolitical_score", 0)),
            "volatility_index": float(r.get("volatility_index", 0)),
            "market_infrastructure_score": float(r.get("market_infrastructure_score", 0)),
            "tax_treaty_quality": float(r.get("tax_treaty_quality", 0)) if "tax_treaty_quality" in r else 0,
            "currency_convertibility": float(r.get("currency_convertibility", 0)),
            "capital_controls": float(r.get("capital_controls", 0)),
            "payment_system_efficiency": float(r.get("payment_system_efficiency", 0)),
            "network_depth": float(r.get("network_depth", 0)),
            "corridor_stability_score": float(r.get("corridor_stability_score", 0)),
        }
        # optionally compute friction via model
        if predict_edges:
            # prepare raw_row dict expected by inference (must contain the exact FEATURE_COLS as keys)
            raw_row = {
                "corridor_volume_musd": attrs["corridor_volume_musd"],
                "fx_spread_bps": attrs["fx_spread_bps"],
                "transfer_fee_percent": attrs["transfer_fee_percent"],
                "settlement_time_days": attrs["settlement_time_days"],
                "tax_rate_percent": attrs["tax_rate_percent"],
                "withholding_tax_amount_musd": attrs["withholding_tax_amount_musd"],
                "compliance_regulatory_score": attrs["compliance_regulatory_score"],
                "sovereign_geopolitical_score": attrs["sovereign_geopolitical_score"],
                "volatility_index": attrs["volatility_index"],
                "market_infrastructure_score": attrs["market_infrastructure_score"],
                "currency_convertibility": attrs["currency_convertibility"],
                "capital_controls": attrs["capital_controls"],
                "payment_system_efficiency": attrs["payment_system_efficiency"],
                "network_depth": attrs["network_depth"],
                "corridor_stability_score": attrs["corridor_stability_score"],
                # engineered feature placeholders (in case inference expects them)
                # inference.predict_friction will use preprocessor with these names - ensure they match
            }
            try:
                friction = predict_friction(raw_row)
                attrs["friction"] = float(friction)
            except Exception as e:
                # fallback: compute simple proxy friction if model fails
                attrs["friction"] = float(attrs["fx_spread_bps"] / 100.0 + attrs["transfer_fee_percent"] + attrs["tax_rate_percent"]/100.0)
                attrs["friction_proxy_error"] = str(e)
        else:
            attrs["friction"] = float(r.get("friction_score", 0))
        G.add_edge(src, dst, **attrs)
    return G
