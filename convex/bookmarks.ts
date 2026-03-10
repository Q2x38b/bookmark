import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getBookmarks = query({
  args: {
    userId: v.id("users"),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    if (args.groupId !== undefined) {
      const groupId = args.groupId
      return await ctx.db
        .query("bookmarks")
        .withIndex("by_user_group", (q) =>
          q.eq("userId", args.userId).eq("groupId", groupId)
        )
        .order("desc")
        .collect()
    }

    return await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect()
  },
})

export const getBookmarksByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bookmarks")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect()
  },
})

export const searchBookmarks = query({
  args: {
    userId: v.id("users"),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.searchQuery.trim()) {
      return await ctx.db
        .query("bookmarks")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect()
    }

    return await ctx.db
      .query("bookmarks")
      .withSearchIndex("search_bookmarks", (q) =>
        q.search("title", args.searchQuery).eq("userId", args.userId)
      )
      .collect()
  },
})

export const createBookmark = mutation({
  args: {
    userId: v.id("users"),
    groupId: v.id("groups"),
    type: v.union(
      v.literal("link"),
      v.literal("note"),
      v.literal("color"),
      v.literal("image"),
      v.literal("file")
    ),
    title: v.string(),
    content: v.string(),
    favicon: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    metadata: v.optional(
      v.object({
        fileName: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        mimeType: v.optional(v.string()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const bookmarkId = await ctx.db.insert("bookmarks", {
      ...args,
      createdAt: now,
      updatedAt: now,
    })

    // Log creation in history
    await ctx.db.insert("bookmarkHistory", {
      bookmarkId,
      userId: args.userId,
      action: "created",
      changes: {},
      snapshot: {
        title: args.title,
        content: args.content,
        groupId: args.groupId,
      },
      createdAt: now,
    })

    return bookmarkId
  },
})

export const updateBookmark = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const { bookmarkId, ...updates } = args
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    )

    if (Object.keys(filteredUpdates).length > 0) {
      const bookmark = await ctx.db.get(bookmarkId)
      if (!bookmark) return

      const now = Date.now()

      // Build changes object for history
      const changes: {
        title?: { from?: string; to?: string }
        content?: { from?: string; to?: string }
        groupId?: { from?: typeof bookmark.groupId; to?: typeof bookmark.groupId }
      } = {}

      if (args.title !== undefined && args.title !== bookmark.title) {
        changes.title = { from: bookmark.title, to: args.title }
      }
      if (args.content !== undefined && args.content !== bookmark.content) {
        changes.content = { from: bookmark.content, to: args.content }
      }
      if (args.groupId !== undefined && args.groupId !== bookmark.groupId) {
        changes.groupId = { from: bookmark.groupId, to: args.groupId }
      }

      // Only log history if there are actual changes
      if (Object.keys(changes).length > 0) {
        const hasGroupChange = changes.groupId !== undefined
        await ctx.db.insert("bookmarkHistory", {
          bookmarkId,
          userId: bookmark.userId,
          action: hasGroupChange ? "moved" : "updated",
          changes,
          snapshot: {
            title: args.title ?? bookmark.title,
            content: args.content ?? bookmark.content,
            groupId: args.groupId ?? bookmark.groupId,
          },
          createdAt: now,
        })
      }

      await ctx.db.patch(bookmarkId, {
        ...filteredUpdates,
        updatedAt: now,
      })
    }
  },
})

export const deleteBookmark = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db.get(args.bookmarkId)

    if (bookmark) {
      // Delete associated shares
      const shares = await ctx.db
        .query("shares")
        .withIndex("by_bookmark", (q) => q.eq("bookmarkId", args.bookmarkId))
        .collect()

      for (const share of shares) {
        await ctx.db.delete(share._id)
      }

      // Log deletion in history (keep full snapshot for restore)
      await ctx.db.insert("bookmarkHistory", {
        bookmarkId: undefined,
        userId: bookmark.userId,
        action: "deleted",
        changes: {},
        snapshot: {
          title: bookmark.title,
          content: bookmark.content,
          groupId: bookmark.groupId,
          type: bookmark.type,
          url: bookmark.content,
          favicon: bookmark.favicon,
        },
        createdAt: Date.now(),
      })

      // Delete associated history entries (keep only the deletion record)
      const history = await ctx.db
        .query("bookmarkHistory")
        .withIndex("by_bookmark", (q) => q.eq("bookmarkId", args.bookmarkId))
        .collect()

      for (const entry of history) {
        await ctx.db.delete(entry._id)
      }

      // Delete storage file if exists
      if (bookmark.fileId) {
        await ctx.storage.delete(bookmark.fileId)
      }

      await ctx.db.delete(args.bookmarkId)
    }
  },
})

export const deleteMultipleBookmarks = mutation({
  args: { bookmarkIds: v.array(v.id("bookmarks")) },
  handler: async (ctx, args) => {
    const now = Date.now()
    for (const bookmarkId of args.bookmarkIds) {
      const bookmark = await ctx.db.get(bookmarkId)

      if (bookmark) {
        // Delete associated shares
        const shares = await ctx.db
          .query("shares")
          .withIndex("by_bookmark", (q) => q.eq("bookmarkId", bookmarkId))
          .collect()

        for (const share of shares) {
          await ctx.db.delete(share._id)
        }

        // Log deletion in history (keep full snapshot for restore)
        await ctx.db.insert("bookmarkHistory", {
          bookmarkId: undefined,
          userId: bookmark.userId,
          action: "deleted",
          changes: {},
          snapshot: {
            title: bookmark.title,
            content: bookmark.content,
            groupId: bookmark.groupId,
            type: bookmark.type,
            url: bookmark.content,
            favicon: bookmark.favicon,
          },
          createdAt: now,
        })

        // Delete associated history entries (keep only the deletion record)
        const history = await ctx.db
          .query("bookmarkHistory")
          .withIndex("by_bookmark", (q) => q.eq("bookmarkId", bookmarkId))
          .collect()

        for (const entry of history) {
          await ctx.db.delete(entry._id)
        }

        // Delete storage file if exists
        if (bookmark.fileId) {
          await ctx.storage.delete(bookmark.fileId)
        }

        await ctx.db.delete(bookmarkId)
      }
    }
  },
})

export const moveBookmarks = mutation({
  args: {
    bookmarkIds: v.array(v.id("bookmarks")),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    for (const bookmarkId of args.bookmarkIds) {
      const bookmark = await ctx.db.get(bookmarkId)
      if (!bookmark) continue

      // Skip if already in the target group
      if (bookmark.groupId === args.groupId) continue

      // Log the move in history
      await ctx.db.insert("bookmarkHistory", {
        bookmarkId,
        userId: bookmark.userId,
        action: "moved",
        changes: {
          groupId: { from: bookmark.groupId, to: args.groupId },
        },
        snapshot: {
          title: bookmark.title,
          content: bookmark.content,
          groupId: args.groupId,
        },
        createdAt: now,
      })

      await ctx.db.patch(bookmarkId, {
        groupId: args.groupId,
        updatedAt: now,
      })
    }
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId)
  },
})

export const updateFavicon = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    favicon: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookmarkId, {
      favicon: args.favicon,
      updatedAt: Date.now(),
    })
  },
})

export const toggleBookmarkPublic = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db.get(args.bookmarkId)
    if (!bookmark) return

    await ctx.db.patch(args.bookmarkId, {
      isPublic: !bookmark.isPublic,
      updatedAt: Date.now(),
    })
  },
})

export const setMultipleBookmarksPublic = mutation({
  args: {
    bookmarkIds: v.array(v.id("bookmarks")),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    for (const bookmarkId of args.bookmarkIds) {
      await ctx.db.patch(bookmarkId, {
        isPublic: args.isPublic,
        updatedAt: Date.now(),
      })
    }
    return args.bookmarkIds.length
  },
})

export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    const groups = await ctx.db
      .query("groups")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    const shares = await ctx.db.query("shares").collect()
    const userShares = shares.filter((share) =>
      bookmarks.some((b) => b._id === share.bookmarkId)
    )

    const totalViews = userShares.reduce(
      (sum, share) => sum + (share.viewCount || 0),
      0
    )

    const typeBreakdown = bookmarks.reduce(
      (acc, b) => {
        acc[b.type] = (acc[b.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalBookmarks: bookmarks.length,
      totalGroups: groups.length,
      totalShares: userShares.length,
      totalViews,
      typeBreakdown,
    }
  },
})
