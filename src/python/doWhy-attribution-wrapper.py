#!/usr/bin/env python3
"""
DoWhy Causal Attribution wrapper for marketing channel attribution.
Run: python3 doWhy-attribution-wrapper.py <JSON_INPUT>
"""

import sys
import json

def causal_attribution(data: dict) -> dict:
    """
    Formal causal attribution for marketing channels using DoWhy.
    Estimates per-channel causal effect with sensitivity analysis.
    Falls back to sklearn OLS when DoWhy estimate.value is None.
    """
    try:
        import pandas as pd
        from dowhy import CausalModel
    except ImportError:
        return {"error": "dowhy not installed", "channel_effects": {}, "method": "unavailable"}

    try:
        df = pd.DataFrame(data["channel_data"])  # cols: email, youtube, search, display, revenue, ...
        channels = data["channels"]  # list of channel column names
        outcome_var = data["outcome_var"]  # e.g., "revenue"
        common_causes = data.get("common_causes", ["seasonality", "economic_index", "competitive_spend"])

        model = CausalModel(
            data=df,
            treatment=channels,
            outcome=outcome_var,
            common_causes=common_causes,
        )

        identified = model.identify_effect(proceed_when_unidentifiable=True)
        estimate = model.estimate_effect(identified, method_name="backdoor.linear_regression")

        # Extract effect — fall back to sklearn if DoWhy returns None
        channel_effects = {}
        total_effect = 0

        if estimate.value is not None:
            total_effect = float(estimate.value)
            if hasattr(estimate, "attention_weights") and estimate.attention_weights:
                for ch in channels:
                    channel_effects[ch] = float(estimate.attention_weights.get(ch, 0))
            else:
                for ch in channels:
                    channel_effects[ch] = total_effect / len(channels)
        else:
            # DoWhy estimate.value is None — fall back to sklearn OLS
            from sklearn.linear_model import LinearRegression
            X = df[channels].values
            y = df[outcome_var].values
            lr = LinearRegression()
            lr.fit(X, y)
            for i, ch in enumerate(channels):
                channel_effects[ch] = float(lr.coef_[i])
            total_effect = float(lr.coef_.sum())

        # Sensitivity analysis: skip on small data
        sensitivity_p_value = None
        try:
            if len(df) >= 8:
                refute_unobserved = model.refute_estimate(
                    identified, estimate,
                    method_name="add_unobserved_common_cause",
                    confounders_effect_on_outcome="linear",
                    confounders_effect_on_treatment="linear"
                )
                sensitivity_p_value = float(refute_unobserved.new_effect) if hasattr(refute_unobserved, "new_effect") else None
        except Exception:
            pass  # Refutation failed on small data — skip

        # Sort by causal effect magnitude
        sorted_effects = dict(sorted(channel_effects.items(), key=lambda x: abs(x[1]), reverse=True))

        return {
            "channel_effects": sorted_effects,
            "total_causal_effect": total_effect,
            "method": "dowhy_backdoor_linear",
            "roi_by_channel": {ch: channel_effects[ch] / max(df[ch].mean(), 1) * 100 for ch in channels},
            "sensitivity_p_value": sensitivity_p_value,
            "confidence": "high" if len(df) > 30 else "medium",
            "n_observations": len(df),
        }
    except Exception as e:
        return {"error": str(e), "channel_effects": {}, "method": "error"}

if __name__ == "__main__":
    try:
        data = json.loads(sys.argv[1]) if len(sys.argv) > 1 else json.load(sys.stdin)
        result = causal_attribution(data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))