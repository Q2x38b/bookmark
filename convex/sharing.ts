import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

function generateShareId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const createShare = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    slug: v.optional(v.string()),
    password: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    isUnsafe: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if share already exists
    const existingShare = await ctx.db
      .query("shares")
      .withIndex("by_bookmark", (q) => q.eq("bookmarkId", args.bookmarkId))
      .unique()

    if (existingShare) {
      return existingShare.shareId
    }

    // If slug provided, check if it's taken
    if (args.slug) {
      const slugExists = await ctx.db
        .query("shares")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug))
        .unique()
      if (slugExists) {
        throw new Error("This slug is already taken")
      }
    }

    // Generate unique share ID
    let shareId = generateShareId()
    let existing = await ctx.db
      .query("shares")
      .withIndex("by_share_id", (q) => q.eq("shareId", shareId))
      .unique()

    while (existing) {
      shareId = generateShareId()
      existing = await ctx.db
        .query("shares")
        .withIndex("by_share_id", (q) => q.eq("shareId", shareId))
        .unique()
    }

    // Create share record
    await ctx.db.insert("shares", {
      bookmarkId: args.bookmarkId,
      shareId,
      slug: args.slug || undefined,
      password: args.password || undefined,
      expiresAt: args.expiresAt || undefined,
      isUnsafe: args.isUnsafe || undefined,
      createdAt: Date.now(),
      viewCount: 0,
    })

    // Update bookmark with shareId
    await ctx.db.patch(args.bookmarkId, { shareId })

    return args.slug || shareId
  },
})

export const checkSlugAvailability = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    if (!args.slug) return true
    const existing = await ctx.db
      .query("shares")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique()
    return !existing
  },
})

export const updateShare = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
    slug: v.optional(v.string()),
    password: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    isUnsafe: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("shares")
      .withIndex("by_bookmark", (q) => q.eq("bookmarkId", args.bookmarkId))
      .unique()

    if (!share) {
      throw new Error("Share not found")
    }

    // If slug changed, check if new slug is taken
    if (args.slug !== undefined && args.slug !== share.slug) {
      if (args.slug) {
        const slugExists = await ctx.db
          .query("shares")
          .withIndex("by_slug", (q) => q.eq("slug", args.slug))
          .unique()
        if (slugExists) {
          throw new Error("This slug is already taken")
        }
      }
    }

    await ctx.db.patch(share._id, {
      slug: args.slug,
      password: args.password,
      expiresAt: args.expiresAt,
      isUnsafe: args.isUnsafe,
    })

    // Update bookmark shareId if slug changed
    const newShareId = args.slug || share.shareId
    await ctx.db.patch(args.bookmarkId, { shareId: newShareId })

    return newShareId
  },
})

export const validateSharePassword = query({
  args: { shareId: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    // Try to find by slug first
    let share = await ctx.db
      .query("shares")
      .withIndex("by_slug", (q) => q.eq("slug", args.shareId))
      .unique()

    // If not found by slug, try shareId
    if (!share) {
      share = await ctx.db
        .query("shares")
        .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
        .unique()
    }

    if (!share) return false
    return share.password === args.password
  },
})

export const deleteShare = mutation({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("shares")
      .withIndex("by_bookmark", (q) => q.eq("bookmarkId", args.bookmarkId))
      .unique()

    if (share) {
      await ctx.db.delete(share._id)
      await ctx.db.patch(args.bookmarkId, { shareId: undefined })
    }
  },
})

export const getSharedBookmark = query({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    // Try to find by slug first
    let share = await ctx.db
      .query("shares")
      .withIndex("by_slug", (q) => q.eq("slug", args.shareId))
      .unique()

    // If not found by slug, try shareId
    if (!share) {
      share = await ctx.db
        .query("shares")
        .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
        .unique()
    }

    if (!share) {
      return null
    }

    // Check if link has expired
    if (share.expiresAt && share.expiresAt < Date.now()) {
      return { expired: true }
    }

    // Return metadata for password-protected or unsafe links
    if (share.password || share.isUnsafe) {
      const bookmark = await ctx.db.get(share.bookmarkId)
      return {
        requiresPassword: !!share.password,
        isUnsafe: !!share.isUnsafe,
        title: bookmark?.title,
      }
    }

    const bookmark = await ctx.db.get(share.bookmarkId)
    if (!bookmark) {
      return null
    }

    // Get file URL if it's an image or file
    let fileUrl: string | null = null
    if (bookmark.fileId) {
      fileUrl = await ctx.storage.getUrl(bookmark.fileId)
    }

    return {
      ...bookmark,
      fileUrl,
    }
  },
})

export const getSharedBookmarkWithPassword = query({
  args: { shareId: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    // Try to find by slug first
    let share = await ctx.db
      .query("shares")
      .withIndex("by_slug", (q) => q.eq("slug", args.shareId))
      .unique()

    // If not found by slug, try shareId
    if (!share) {
      share = await ctx.db
        .query("shares")
        .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
        .unique()
    }

    if (!share) {
      return null
    }

    // Check expiration
    if (share.expiresAt && share.expiresAt < Date.now()) {
      return { expired: true }
    }

    // Verify password
    if (share.password && share.password !== args.password) {
      return { invalidPassword: true }
    }

    const bookmark = await ctx.db.get(share.bookmarkId)
    if (!bookmark) {
      return null
    }

    // Get file URL if it's an image or file
    let fileUrl: string | null = null
    if (bookmark.fileId) {
      fileUrl = await ctx.storage.getUrl(bookmark.fileId)
    }

    return {
      ...bookmark,
      fileUrl,
      isUnsafe: share.isUnsafe,
    }
  },
})

export const getUserShares = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    const sharedBookmarks = bookmarks.filter((b) => b.shareId)

    // Get share details for each bookmark
    const sharesWithDetails = await Promise.all(
      sharedBookmarks.map(async (b) => {
        const share = await ctx.db
          .query("shares")
          .withIndex("by_bookmark", (q) => q.eq("bookmarkId", b._id))
          .unique()

        const shareIdentifier = share?.slug || share?.shareId || b.shareId

        return {
          ...b,
          shareUrl: `/share/${shareIdentifier}`,
          viewCount: share?.viewCount ?? 0,
          slug: share?.slug,
          hasPassword: !!share?.password,
          expiresAt: share?.expiresAt,
          isUnsafe: share?.isUnsafe,
        }
      })
    )

    return sharesWithDetails
  },
})

export const getShareByBookmark = query({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("shares")
      .withIndex("by_bookmark", (q) => q.eq("bookmarkId", args.bookmarkId))
      .unique()

    if (!share) return null

    return {
      ...share,
      effectiveShareId: share.slug || share.shareId,
    }
  },
})

export const incrementViewCount = mutation({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    // Try to find by slug first
    let share = await ctx.db
      .query("shares")
      .withIndex("by_slug", (q) => q.eq("slug", args.shareId))
      .unique()

    // If not found by slug, try shareId
    if (!share) {
      share = await ctx.db
        .query("shares")
        .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
        .unique()
    }

    if (share) {
      await ctx.db.patch(share._id, {
        viewCount: (share.viewCount ?? 0) + 1,
      })
    }
  },
})

export const createBulkShares = mutation({
  args: {
    bookmarkIds: v.array(v.id("bookmarks")),
  },
  handler: async (ctx, args) => {
    const results: { bookmarkId: string; shareId: string; alreadyShared: boolean }[] = []

    for (const bookmarkId of args.bookmarkIds) {
      // Check if share already exists
      const existingShare = await ctx.db
        .query("shares")
        .withIndex("by_bookmark", (q) => q.eq("bookmarkId", bookmarkId))
        .unique()

      if (existingShare) {
        results.push({
          bookmarkId: bookmarkId,
          shareId: existingShare.slug || existingShare.shareId,
          alreadyShared: true,
        })
        continue
      }

      // Generate unique share ID
      let shareId = generateShareId()
      let existing = await ctx.db
        .query("shares")
        .withIndex("by_share_id", (q) => q.eq("shareId", shareId))
        .unique()

      while (existing) {
        shareId = generateShareId()
        existing = await ctx.db
          .query("shares")
          .withIndex("by_share_id", (q) => q.eq("shareId", shareId))
          .unique()
      }

      // Create share record
      await ctx.db.insert("shares", {
        bookmarkId,
        shareId,
        createdAt: Date.now(),
        viewCount: 0,
      })

      // Update bookmark with shareId
      await ctx.db.patch(bookmarkId, { shareId })

      results.push({
        bookmarkId: bookmarkId,
        shareId,
        alreadyShared: false,
      })
    }

    return results
  },
})

export const getSharesForBookmarks = query({
  args: { bookmarkIds: v.array(v.id("bookmarks")) },
  handler: async (ctx, args) => {
    const shares = await Promise.all(
      args.bookmarkIds.map(async (bookmarkId) => {
        const share = await ctx.db
          .query("shares")
          .withIndex("by_bookmark", (q) => q.eq("bookmarkId", bookmarkId))
          .unique()

        const bookmark = await ctx.db.get(bookmarkId)

        if (!share || !bookmark) return null

        return {
          ...bookmark,
          shareUrl: `/share/${share.slug || share.shareId}`,
          shareId: share._id,
          effectiveShareId: share.slug || share.shareId,
          viewCount: share.viewCount ?? 0,
          slug: share.slug,
          hasPassword: !!share.password,
          expiresAt: share.expiresAt,
          isUnsafe: share.isUnsafe,
        }
      })
    )

    return shares.filter(Boolean)
  },
})
