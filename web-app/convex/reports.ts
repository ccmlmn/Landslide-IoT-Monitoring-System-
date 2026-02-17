import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Submit a new report from community
export const submitReport = mutation({
  args: {
    userName: v.string(),
    userEmail: v.string(),
    reportType: v.string(),
    description: v.string(),
    location: v.optional(v.string()),
    severity: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamp = new Date().toISOString();
    
    const reportId = await ctx.db.insert("reports", {
      timestamp,
      userName: args.userName,
      userEmail: args.userEmail,
      reportType: args.reportType,
      description: args.description,
      location: args.location,
      severity: args.severity,
      status: "Pending",
    });
    
    return reportId;
  },
});

// Get all reports (Admin)
export const getAllReports = query({
  args: {},
  handler: async (ctx) => {
    const reports = await ctx.db
      .query("reports")
      .order("desc")
      .collect();
    return reports;
  },
});

// Get reports by status
export const getReportsByStatus = query({
  args: {
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
    return reports;
  },
});

// Get recent reports (limited)
export const getRecentReports = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("reports")
      .order("desc")
      .take(args.limit);
    return reports;
  },
});

// Update report status (Admin)
export const updateReportStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.string(),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      status: args.status,
      adminNotes: args.adminNotes,
    });
  },
});

// Get report statistics
export const getReportStats = query({
  args: {},
  handler: async (ctx) => {
    const allReports = await ctx.db.query("reports").collect();
    
    const pending = allReports.filter(r => r.status === "Pending").length;
    const reviewed = allReports.filter(r => r.status === "Reviewed").length;
    const resolved = allReports.filter(r => r.status === "Resolved").length;
    
    const highSeverity = allReports.filter(r => r.severity === "High").length;
    const mediumSeverity = allReports.filter(r => r.severity === "Medium").length;
    const lowSeverity = allReports.filter(r => r.severity === "Low").length;
    
    return {
      total: allReports.length,
      pending,
      reviewed,
      resolved,
      highSeverity,
      mediumSeverity,
      lowSeverity,
    };
  },
});
