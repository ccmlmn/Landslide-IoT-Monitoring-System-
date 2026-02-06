import { query } from "./_generated/server";

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("anomalyResults")
      .order("desc")
      .first();
  },
});
