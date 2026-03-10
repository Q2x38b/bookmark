import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getBookmarkHistory = query({
  args: {
    bookmarkId: v.id("bookmarks"),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("bookmarkHistory")
      .withIndex("by_bookmark", (q) => q.eq("bookmarkId", args.bookmarkId))
      .order("desc")
      .collect()

    // Get group names for each history entry
    const historyWithGroups = await Promise.all(
      history.map(async (entry) => {
        let fromGroupName: string | undefined
        let toGroupName: string | undefined
        let snapshotGroupName: string | undefined

        if (entry.changes.groupId?.from) {
          const fromGroup = await ctx.db.get(entry.changes.groupId.from)
          fromGroupName = fromGroup?.name
        }
        if (entry.changes.groupId?.to) {
          const toGroup = await ctx.db.get(entry.changes.groupId.to)
          toGroupName = toGroup?.name
        }
        if (entry.snapshot.groupId) {
          const snapshotGroup = await ctx.db.get(entry.snapshot.groupId)
          snapshotGroupName = snapshotGroup?.name
        }

        return {
          ...entry,
          fromGroupName,
          toGroupName,
          snapshotGroupName,
        }
      })
    )

    return historyWithGroups
  },
})

export const getUserHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50

    const history = await ctx.db
      .query("bookmarkHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit)

    // Get group names and bookmark info for each history entry
    const historyWithDetails = await Promise.all(
      history.map(async (entry) => {
        let fromGroupName: string | undefined
        let toGroupName: string | undefined
        let snapshotGroupName: string | undefined
        let bookmarkTitle: string | undefined
        let bookmarkExists = false

        if (entry.changes.groupId?.from) {
          const fromGroup = await ctx.db.get(entry.changes.groupId.from)
          fromGroupName = fromGroup?.name
        }
        if (entry.changes.groupId?.to) {
          const toGroup = await ctx.db.get(entry.changes.groupId.to)
          toGroupName = toGroup?.name
        }
        if (entry.snapshot.groupId) {
          const snapshotGroup = await ctx.db.get(entry.snapshot.groupId)
          snapshotGroupName = snapshotGroup?.name
        }

        // Get bookmark info if it exists
        if (entry.bookmarkId) {
          const bookmark = await ctx.db.get(entry.bookmarkId)
          if (bookmark) {
            bookmarkTitle = bookmark.title
            bookmarkExists = true
          }
        }

        return {
          ...entry,
          fromGroupName,
          toGroupName,
          snapshotGroupName,
          bookmarkTitle: bookmarkTitle || entry.snapshot.title,
          bookmarkExists,
        }
      })
    )

    return historyWithDetails
  },
})

export const getDeletedBookmarks = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const deletedHistory = await ctx.db
      .query("bookmarkHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect()

    // Filter to only deleted bookmarks
    const deleted = deletedHistory.filter((entry) => entry.action === "deleted")

    // Get group names for each
    const deletedWithGroups = await Promise.all(
      deleted.map(async (entry) => {
        let snapshotGroupName: string | undefined
        let groupExists = false

        if (entry.snapshot.groupId) {
          const snapshotGroup = await ctx.db.get(entry.snapshot.groupId)
          snapshotGroupName = snapshotGroup?.name
          groupExists = !!snapshotGroup
        }

        return {
          ...entry,
          snapshotGroupName,
          groupExists,
        }
      })
    )

    return deletedWithGroups
  },
})

export const restoreBookmarkVersion = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    historyId: v.id("bookmarkHistory"),
  },
  handler: async (ctx, args) => {
    const bookmark = await ctx.db.get(args.bookmarkId)
    if (!bookmark) throw new Error("Bookmark not found")

    const historyEntry = await ctx.db.get(args.historyId)
    if (!historyEntry) throw new Error("History entry not found")

    // Verify the history entry belongs to this bookmark
    if (historyEntry.bookmarkId !== args.bookmarkId) {
      throw new Error("History entry does not belong to this bookmark")
    }

    // Create a history entry for this restore action
    await ctx.db.insert("bookmarkHistory", {
      bookmarkId: args.bookmarkId,
      userId: bookmark.userId,
      action: "updated",
      changes: {
        title: bookmark.title !== historyEntry.snapshot.title
          ? { from: bookmark.title, to: historyEntry.snapshot.title }
          : undefined,
        content: bookmark.content !== historyEntry.snapshot.content
          ? { from: bookmark.content, to: historyEntry.snapshot.content }
          : undefined,
        groupId: bookmark.groupId !== historyEntry.snapshot.groupId
          ? { from: bookmark.groupId, to: historyEntry.snapshot.groupId }
          : undefined,
      },
      snapshot: {
        title: historyEntry.snapshot.title,
        content: historyEntry.snapshot.content,
        groupId: historyEntry.snapshot.groupId,
      },
      createdAt: Date.now(),
    })

    // Restore the bookmark to the snapshot state
    await ctx.db.patch(args.bookmarkId, {
      title: historyEntry.snapshot.title,
      content: historyEntry.snapshot.content,
      groupId: historyEntry.snapshot.groupId,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

export const restoreDeletedBookmark = mutation({
  args: {
    historyId: v.id("bookmarkHistory"),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const historyEntry = await ctx.db.get(args.historyId)
    if (!historyEntry) throw new Error("History entry not found")

    if (historyEntry.action !== "deleted") {
      throw new Error("This history entry is not a deleted bookmark")
    }

    // Check if the original group still exists, otherwise use the provided groupId
    let targetGroupId = args.groupId || historyEntry.snapshot.groupId
    const targetGroup = await ctx.db.get(targetGroupId)

    if (!targetGroup) {
      // Find the user's first group (General)
      const groups = await ctx.db
        .query("groups")
        .withIndex("by_user", (q) => q.eq("userId", historyEntry.userId))
        .collect()

      if (groups.length === 0) {
        throw new Error("No group available to restore bookmark to")
      }
      targetGroupId = groups[0]._id
    }

    const now = Date.now()

    // Create the bookmark
    const bookmarkId = await ctx.db.insert("bookmarks", {
      userId: historyEntry.userId,
      groupId: targetGroupId,
      type: historyEntry.snapshot.type || "link",
      title: historyEntry.snapshot.title,
      content: historyEntry.snapshot.content,
      favicon: historyEntry.snapshot.favicon,
      createdAt: now,
      updatedAt: now,
    })

    // Log the restoration as a creation
    await ctx.db.insert("bookmarkHistory", {
      bookmarkId,
      userId: historyEntry.userId,
      action: "created",
      changes: {},
      snapshot: {
        title: historyEntry.snapshot.title,
        content: historyEntry.snapshot.content,
        groupId: targetGroupId,
      },
      createdAt: now,
    })

    // Delete the deleted history entry
    await ctx.db.delete(args.historyId)

    return { bookmarkId }
  },
})

export const clearDeletedHistory = mutation({
  args: {
    historyId: v.id("bookmarkHistory"),
  },
  handler: async (ctx, args) => {
    const historyEntry = await ctx.db.get(args.historyId)
    if (!historyEntry) throw new Error("History entry not found")

    if (historyEntry.action !== "deleted") {
      throw new Error("Can only clear deleted bookmark history")
    }

    await ctx.db.delete(args.historyId)
    return { success: true }
  },
})

export const logBookmarkCreation = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    userId: v.id("users"),
    title: v.string(),
    content: v.optional(v.string()),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("bookmarkHistory", {
      bookmarkId: args.bookmarkId,
      userId: args.userId,
      action: "created",
      changes: {},
      snapshot: {
        title: args.title,
        content: args.content,
        groupId: args.groupId,
      },
      createdAt: Date.now(),
    })
  },
})

export const logBookmarkUpdate = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    userId: v.id("users"),
    changes: v.object({
      title: v.optional(v.object({
        from: v.optional(v.string()),
        to: v.optional(v.string()),
      })),
      content: v.optional(v.object({
        from: v.optional(v.string()),
        to: v.optional(v.string()),
      })),
      groupId: v.optional(v.object({
        from: v.optional(v.id("groups")),
        to: v.optional(v.id("groups")),
      })),
    }),
    snapshot: v.object({
      title: v.string(),
      content: v.optional(v.string()),
      groupId: v.id("groups"),
    }),
  },
  handler: async (ctx, args) => {
    const hasGroupChange = args.changes.groupId !== undefined
    const action = hasGroupChange ? "moved" : "updated"

    await ctx.db.insert("bookmarkHistory", {
      bookmarkId: args.bookmarkId,
      userId: args.userId,
      action,
      changes: args.changes,
      snapshot: args.snapshot,
      createdAt: Date.now(),
    })
  },
})

export const deleteBookmarkHistory = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("bookmarkHistory")
      .withIndex("by_bookmark", (q) => q.eq("bookmarkId", args.bookmarkId))
      .collect()

    for (const entry of history) {
      await ctx.db.delete(entry._id)
    }
  },
})
