import shap
import pandas as pd

def explain_route_with_shap(model, X_valid, feature_names, route_edges, target="friction_score"):
    """
    Generate a full explanation of the route selection based on SHAP values.

    Args:
    - model: Trained model (XGBoost)
    - X_valid: DataFrame containing the validation data
    - feature_names: List of feature names used in the model
    - route_edges: List of edges (corridors) that make up the route, each represented as a dictionary of feature values
    - target: Name of the target column (default: 'friction_score')

    Returns:
    - A string summarizing the SHAP-based explanation of the selected route
    """
    
    # Initialize SHAP explainer
    explainer = shap.TreeExplainer(model)

    # List to hold explanations for each edge
    edge_explanations = []
    
    # Step 1: Explain each edge (corridor) in the route
    for edge in route_edges:
        # Prepare edge features as a DataFrame
        X_edge = pd.DataFrame([edge], columns=feature_names)
        
        # Calculate SHAP values for the edge
        shap_values = explainer.shap_values(X_edge)
        
        # Extract and sort the SHAP values for this edge
        feature_contrib = sorted(
            zip(feature_names, shap_values[0]),
            key=lambda x: abs(x[1]),
            reverse=True
        )
        
        edge_explanation = {
            "path": edge,
            "shap_values": feature_contrib
        }
        
        edge_explanations.append(edge_explanation)

    # Step 2: Aggregate and summarize SHAP values across all edges in the route
    total_shap = {}
    for edge_expl in edge_explanations:
        for feat, val in edge_expl['shap_values']:
            total_shap[feat] = total_shap.get(feat, 0) + val
    
    # Step 3: Sort total SHAP contributions and prepare explanation for the entire route
    sorted_total = sorted(total_shap.items(), key=lambda x: abs(x[1]), reverse=True)
    
    # Prepare the final route explanation
    route_explanation = "Why this route was selected based on SHAP values:\n"
    route_explanation += "--------------------------------------------\n"
    
    for feat, val in sorted_total[:5]:  # Top 5 contributing features
        if val > 0:
            route_explanation += f"• {feat.replace('_',' ').title()} increases friction by {val:.2f}\n"
        else:
            route_explanation += f"• {feat.replace('_',' ').title()} reduces friction by {abs(val):.2f}\n"
    
    return route_explanation


# Example Usage

# Assuming 'model' is your trained XGBoost model
# Assuming 'X_valid' is the validation dataset
# Assuming 'route_edges' contains a list of dictionaries representing corridors in the route

# feature_names should be the list of features that your model was trained with.
# Example route_edges might look like this:
# route_edges = [
#     {'source_country': 'Australia', 'destination_country': 'Indonesia', 'fx_spread_bps': 77.24, 'tax_rate_percent': 13.67, 'settlement_time_days': 28.81, 'friction_score': 2.78},
#     {'source_country': 'Ireland', 'destination_country': 'Indonesia', 'fx_spread_bps': 81.11, 'tax_rate_percent': 10.21, 'settlement_time_days': 7.4, 'friction_score': 1.97},
#     # Add more edges here
# ]

# # Get the explanation for the entire route
# route_explanation = explain_route_with_shap(model, X_valid, feature_names, route_edges)

# # Print the explanation
# print(route_explanation)
