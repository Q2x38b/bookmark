import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getGroups = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return groups.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const createGroup = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const groupId = await ctx.db.insert("groups", {
      userId: args.userId,
      name: args.name,
      color: args.color || "#6366f1",
      createdAt: Date.now(),
    });
    return groupId;
  },
});

export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { groupId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(groupId, filteredUpdates);
  },
});

export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    // Delete all bookmarks in the group
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id);
    }

    await ctx.db.delete(args.groupId);
  },
});
