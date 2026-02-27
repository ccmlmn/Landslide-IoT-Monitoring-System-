import { query } from "./_generated/server";
import { v } from "convex/values";

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("anomalyResults")
      .order("desc")
      .first();
  },
});

// Get all anomaly results for alerts & logs page
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const results = await ctx.db
      .query("anomalyResults")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
    return results;
  },
});
