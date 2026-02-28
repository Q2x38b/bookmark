import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getBookmarks = query({
  args: {
    userId: v.id("users"),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_group", (q) =>
        q.eq("userId", args.userId).eq("groupId", args.groupId)
      )
      .collect();
    return bookmarks.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const searchBookmarks = query({
  args: {
    userId: v.id("users"),
    groupId: v.id("groups"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_group", (q) =>
        q.eq("userId", args.userId).eq("groupId", args.groupId)
      )
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    return bookmarks
      .filter(
        (b) =>
          b.title.toLowerCase().includes(searchLower) ||
          b.url?.toLowerCase().includes(searchLower) ||
          b.content?.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const createBookmark = mutation({
  args: {
    userId: v.id("users"),
    groupId: v.id("groups"),
    type: v.union(
      v.literal("link"),
      v.literal("text"),
      v.literal("image"),
      v.literal("color")
    ),
    title: v.string(),
    url: v.optional(v.string()),
    favicon: v.optional(v.string()),
    content: v.optional(v.string()),
    color: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bookmarkId = await ctx.db.insert("bookmarks", {
      ...args,
      createdAt: Date.now(),
    });
    return bookmarkId;
  },
});

export const updateBookmark = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    favicon: v.optional(v.string()),
    content: v.optional(v.string()),
    color: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const { bookmarkId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(bookmarkId, filteredUpdates);
  },
});

export const deleteBookmark = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.bookmarkId);
  },
});

export const deleteMultipleBookmarks = mutation({
  args: { bookmarkIds: v.array(v.id("bookmarks")) },
  handler: async (ctx, args) => {
    for (const id of args.bookmarkIds) {
      await ctx.db.delete(id);
    }
  },
});

export const moveBookmarks = mutation({
  args: {
    bookmarkIds: v.array(v.id("bookmarks")),
    targetGroupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    for (const id of args.bookmarkIds) {
      await ctx.db.patch(id, { groupId: args.targetGroupId });
    }
  },
});
