import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getGroups = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groups")
      .withIndex("by_user_order", (q) => q.eq("userId", args.userId))
      .collect()
  },
})

export const createGroup = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the highest order number
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    const maxOrder = groups.length > 0
      ? Math.max(...groups.map(g => g.order ?? 0))
      : -1

    return await ctx.db.insert("groups", {
      userId: args.userId,
      name: args.name,
      color: args.color,
      order: maxOrder + 1,
      createdAt: Date.now(),
    })
  },
})

export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { groupId, ...updates } = args
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    )

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(groupId, filteredUpdates)
    }
  },
})

export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    // Delete all bookmarks in this group
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect()

    for (const bookmark of bookmarks) {
      // Delete associated shares
      const shares = await ctx.db
        .query("shares")
        .withIndex("by_bookmark", (q) => q.eq("bookmarkId", bookmark._id))
        .collect()

      for (const share of shares) {
        await ctx.db.delete(share._id)
      }

      // Delete storage files if any
      if (bookmark.fileId) {
        await ctx.storage.delete(bookmark.fileId)
      }

      await ctx.db.delete(bookmark._id)
    }

    await ctx.db.delete(args.groupId)
  },
})

export const reorderGroups = mutation({
  args: {
    groupIds: v.array(v.id("groups")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.groupIds.length; i++) {
      await ctx.db.patch(args.groupIds[i], { order: i })
    }
  },
})
