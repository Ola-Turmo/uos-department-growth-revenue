/**
 * Attribution Evaluation Suite
 * Validates multi-touch attribution correctness across models
 */

import { AttributionEngine } from "../../src/attribution/models.js";
import type { Touchpoint } from "../../src/types/types.js";

const engine = new AttributionEngine();

function createTouchpoint(userId: string, channel: string, timestamp: string): Touchpoint {
  return {
    userId,
    channel: channel as Touchpoint["channel"],
    timestamp,
    sessionId: `session-${Math.random()}`,
    event: "engagement",
    value: 1,
  };
}

// Golden case: Multi-touch journey with known attribution
const goldenCase = {
  touchpoints: [
    createTouchpoint("u1", "organic_search", "2024-01-01T10:00:00Z"),
    createTouchpoint("u1", "paid_social", "2024-01-01T11:00:00Z"),
    createTouchpoint("u1", "email", "2024-01-01T12:00:00Z"),
    createTouchpoint("u1", "direct", "2024-01-01T13:00:00Z"),
  ],
  conversions: [{ userId: "u1", revenue: 400, conversionDate: "2024-01-01T13:00:00Z" }],
};

export const attributionEval = {
  name: "attribution-multi-touch",
  
  run(): { passed: boolean; message: string }[] {
    const results: { passed: boolean; message: string }[] = [];
    
    // Test first_touch
    const firstTouch = engine.computeAttribution({
      ...goldenCase,
      config: { model: "first_touch", lookbackWindowDays: 30 },
    })[0];
    
    results.push({
      passed: firstTouch.channelAttribution.organic_search === 1,
      message: `first_touch: organic_search should get 100% (got ${firstTouch.channelAttribution.organic_search})`,
    });

    // Test last_touch
    const lastTouch = engine.computeAttribution({
      ...goldenCase,
      config: { model: "last_touch", lookbackWindowDays: 30 },
    })[0];
    
    results.push({
      passed: lastTouch.channelAttribution.direct === 1,
      message: `last_touch: direct should get 100% (got ${lastTouch.channelAttribution.direct})`,
    });

    // Test linear (4 channels, each gets 25%)
    const linear = engine.computeAttribution({
      ...goldenCase,
      config: { model: "linear", lookbackWindowDays: 30 },
    })[0];
    
    results.push({
      passed: Math.abs(linear.channelAttribution.organic_search - 0.25) < 0.01,
      message: `linear: each channel should get 25%`,
    });

    // Test u-shaped (40% first, 20% middle, 40% last)
    const ushaped = engine.computeAttribution({
      ...goldenCase,
      config: { model: "u_shaped", lookbackWindowDays: 30, uShapedFirstLastWeight: 0.4 },
    })[0];
    
    results.push({
      passed: Math.abs(ushaped.channelAttribution.organic_search - 0.4) < 0.01,
      message: `u_shaped: organic_search should get 40% (got ${ushaped.channelAttribution.organic_search})`,
    });

    return results;
  },
};
