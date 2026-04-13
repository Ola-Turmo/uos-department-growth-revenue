#!/usr/bin/env python3
"""
CausalNex Channel Discovery — discover causal relationships between marketing channels.
Run: python3 causalnex-discovery-wrapper.py <JSON_INPUT>
"""

import sys
import json

def discover_causal_structure(data: dict) -> dict:
    """
    Use CausalNex NOTEARS to learn causal DAG from observational channel data.
    Returns discovered edges and key causal drivers.
    """
    try:
        import pandas as pd
        from causalnex.structure.notears import from_pandas
        from causalnex.structure import StructureModel
    except ImportError:
        return {"error": "causalnex not installed", "edges": [], "key_drivers": []}

    try:
        df = pd.DataFrame(data["channel_data"])
        # NOTEARS: learns structure from observational data
        sm = from_pandas(df, tabu_parent_nodes=[], tabu_child_nodes=[])
        
        edges = [(str(e[0]), str(e[1]), float(sm.edges[e].get("weight", 0))) 
                 for e in sm.edges()]
        
        # Key drivers: nodes with most incoming edges (root causes)
        in_degree = {}
        for (src, tgt, w) in edges:
            in_degree[tgt] = in_degree.get(tgt, 0) + abs(w)
        
        key_drivers = sorted(in_degree.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "edges": edges,
            "key_drivers": [{"node": n, "incoming_strength": s} for n, s in key_drivers],
            "method": "causalnex_notears",
            "n_nodes": len(df.columns),
            "n_edges": len(edges),
            "directed": True,
        }
    except Exception as e:
        return {"error": str(e), "edges": [], "key_drivers": []}

if __name__ == "__main__":
    try:
        data = json.loads(sys.argv[1]) if len(sys.argv) > 1 else json.load(sys.stdin)
        result = discover_causal_structure(data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))