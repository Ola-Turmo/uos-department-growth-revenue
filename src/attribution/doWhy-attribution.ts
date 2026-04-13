// src/attribution/doWhy-attribution.ts
/**
 * DoWhy Causal Attribution — TypeScript adapter for marketing channel attribution.
 */

import { spawn } from "child_process";
import { join } from "path";
import type { Channel } from "../types/types.js";

export interface ChannelDataPoint {
  period: string;
  [channel: string]: string | number;  // e.g., email_spend: 10000, youtube_spend: 20000, revenue: 50000
}

export interface DoWhyAttributionResult {
  channelEffects: Record<string, number>;
  totalCausalEffect: number;
  roiByChannel: Record<string, number>;
  method: string;
  confidence: "high" | "medium" | "low";
  sensitivityPValue?: number;
  narrative: string;
  topChannel: string;
}

export class DoWhyAttributionAnalyzer {
  /**
   * Formal causal attribution for marketing channels.
   * Uses DoWhy backdoor criterion with linear regression estimation.
   */
  async analyze(params: {
    channelData: ChannelDataPoint[];
    channels: string[];
    outcomeVar: string;
    commonCauses?: string[];
  }): Promise<DoWhyAttributionResult> {
    const pythonScript = join(__dirname, "..", "python", "doWhy-attribution-wrapper.py");

    return new Promise((resolve) => {
      const proc = spawn("python3", [
        pythonScript,
        JSON.stringify({
          channel_data: params.channelData,
          channels: params.channels,
          outcome_var: params.outcomeVar,
          common_causes: params.commonCauses ?? ["seasonality", "economic_index", "competitive_spend"],
        }),
      ], { timeout: 60000 });

      let stdout = "", stderr = "";
      proc.stdout.on("data", (d) => { stdout += d.toString(); });
      proc.stderr.on("data", (d) => { stderr += d.toString(); });

      proc.on("close", (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            const result = JSON.parse(stdout.trim());
            if (result.error) { resolve(this.fallback(params, result.error)); return; }
            const channelEffects = result.channel_effects as Record<string, number> ?? {};
            const topChannel = Object.entries(channelEffects)
              .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]?.[0] ?? params.channels[0];
            resolve({
              channelEffects: result.channel_effects ?? {},
              totalCausalEffect: result.total_causal_effect ?? 0,
              roiByChannel: result.roi_by_channel ?? {},
              method: result.method ?? "dowhy",
              confidence: result.confidence ?? "medium",
              sensitivityPValue: result.sensitivity_p_value,
              topChannel,
              narrative: this.generateNarrative(params.channels, result.channel_effects ?? {}, topChannel),
            });
          } catch { resolve(this.fallback(params, "parse error")); }
        } else { resolve(this.fallback(params, stderr || "no python")); }
      });
      proc.on("error", () => resolve(this.fallback(params, "process error")));
    });
  }

  private generateNarrative(channels: string[], effects: Record<string, number>, topChannel: string): string {
    const sorted = Object.entries(effects).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    const lines = sorted.slice(0, 4).map(([ch, eff]) => `${ch}: ${eff > 0 ? "+" : ""}${eff.toFixed(2)}`);
    return `Top causal driver: ${topChannel}. Effects: ${lines.join(", ")}.`;
  }

  private fallback(params: {
    channels: string[];
    outcomeVar: string;
    channelData: ChannelDataPoint[];
  }, _error: string): DoWhyAttributionResult {
    // Simple correlation fallback
    const outcomeVals = params.channelData.map(d => Number(d[params.outcomeVar]) || 0);
    const effects: Record<string, number> = {};
    for (const ch of params.channels) {
      const chVals = params.channelData.map(d => Number(d[ch]) || 0);
      effects[ch] = this.correlation(chVals, outcomeVals);
    }
    const topChannel = Object.entries(effects).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]?.[0] ?? params.channels[0];
    return {
      channelEffects: effects,
      totalCausalEffect: Object.values(effects).reduce((a, b) => a + b, 0),
      roiByChannel: {},
      method: "correlation_fallback",
      confidence: "low",
      topChannel,
      narrative: this.generateNarrative(params.channels, effects, topChannel),
    };
  }

  private correlation(a: number[], b: number[]): number {
    const n = Math.min(a.length, b.length);
    if (n === 0) return 0;
    const ma = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
    const mb = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
    let num = 0, denA = 0, denB = 0;
    for (let i = 0; i < n; i++) {
      const da = a[i] - ma, db = b[i] - mb;
      num += da * db; denA += da * da; denB += db * db;
    }
    const den = Math.sqrt(denA * denB);
    return den > 0 ? num / den : 0;
  }
}