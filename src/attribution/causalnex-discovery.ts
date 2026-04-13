// src/attribution/causalnex-discovery.ts
/**
 * CausalNex Channel Discovery — discover causal structure between channels.
 */

import { spawn } from "child_process";
import { join } from "path";

export interface CausalEdge { source: string; target: string; weight: number; }

export interface CausalDiscoveryResult {
  edges: CausalEdge[];
  keyDrivers: Array<{ node: string; incomingStrength: number }>;
  method: string;
  nNodes: number;
  nEdges: number;
  narrative: string;
}

export class CausalChannelDiscovery {
  /**
   * Discover causal structure between channels using CausalNex NOTEARS.
   * Input: time-series channel data (spend + outcomes per period)
   * Output: directed acyclic graph of causal relationships
   */
  async discover(params: {
    channelData: Record<string, number>[];
    nodeNames: string[];
  }): Promise<CausalDiscoveryResult> {
    const pythonScript = join(__dirname, "..", "python", "causalnex-discovery-wrapper.py");

    return new Promise((resolve) => {
      const proc = spawn("python3", [
        pythonScript,
        JSON.stringify({ channel_data: params.channelData }),
      ], { timeout: 60000 });

      let stdout = "", stderr = "";
      proc.stdout.on("data", (d) => { stdout += d.toString(); });
      proc.stderr.on("data", (d) => { stderr += d.toString(); });

      proc.on("close", (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            const result = JSON.parse(stdout.trim());
            if (result.error) { resolve(this.fallback(params)); return; }
            resolve({
              edges: (result.edges ?? []).map((e: any) => ({ source: e[0], target: e[1], weight: e[2] })),
              keyDrivers: (result.key_drivers ?? []).map((d: any) => ({ node: d.node, incomingStrength: d.incoming_strength })),
              method: result.method ?? "causalnex",
              nNodes: result.n_nodes ?? params.nodeNames.length,
              nEdges: result.n_edges ?? 0,
              narrative: this.generateNarrative(result.key_drivers ?? [], result.edges ?? []),
            });
          } catch { resolve(this.fallback(params)); }
        } else { resolve(this.fallback(params)); }
      });
      proc.on("error", () => resolve(this.fallback(params)));
    });
  }

  private generateNarrative(drivers: any[], edges: any[]): string {
    if (!drivers.length) return "No causal structure detected.";
    const top = drivers[0];
    return `Primary causal driver: ${top?.node ?? "unknown"} (incoming strength: ${(top?.incoming_strength ?? 0).toFixed(2)}). ${edges.length} causal relationships discovered across channels.`;
  }

  private fallback(params: { nodeNames: string[]; channelData: Record<string, number>[] }): CausalDiscoveryResult {
    return {
      edges: [],
      keyDrivers: params.nodeNames.slice(0, 3).map(n => ({ node: n, incomingStrength: 0 })),
      method: "none",
      nNodes: params.nodeNames.length,
      nEdges: 0,
      narrative: "CausalNex unavailable. Use correlation-based analysis.",
    };
  }
}