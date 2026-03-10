import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getOrCreateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()

    if (existingUser) {
      // Update user info if changed
      if (
        existingUser.email !== args.email ||
        existingUser.name !== args.name ||
        existingUser.avatarUrl !== args.avatarUrl
      ) {
        await ctx.db.patch(existingUser._id, {
          email: args.email,
          name: args.name,
          avatarUrl: args.avatarUrl,
        })
      }
      return existingUser._id
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      createdAt: Date.now(),
    })

    // Create default "General" group for new user
    await ctx.db.insert("groups", {
      userId,
      name: "General",
      color: "#6366f1",
      order: 0,
      createdAt: Date.now(),
    })

    return userId
  },
})

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()
  },
})

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId)
  },
})

export const updateTheme = mutation({
  args: {
    userId: v.id("users"),
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      theme: args.theme,
    })
  },
})

export const updateKeyboardShortcuts = mutation({
  args: {
    userId: v.id("users"),
    keyboardShortcuts: v.object({
      focusSearch: v.optional(v.string()),
      copyBookmark: v.optional(v.string()),
      renameBookmark: v.optional(v.string()),
      deleteBookmark: v.optional(v.string()),
      selectAll: v.optional(v.string()),
      toggleSelect: v.optional(v.string()),
      navigateUp: v.optional(v.string()),
      navigateDown: v.optional(v.string()),
      exitSelection: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      keyboardShortcuts: args.keyboardShortcuts,
    })
  },
})

// Check if a username is available (server-side validation)
export const checkUsernameAvailable = query({
  args: { username: v.string(), currentUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const username = args.username.toLowerCase().trim()

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return { available: false, reason: "Username must be 3-20 characters" }
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return { available: false, reason: "Only letters, numbers, and underscores" }
    }

    // Reserved usernames
    const reserved = ["admin", "settings", "api", "share", "public", "profile", "user", "help", "support"]
    if (reserved.includes(username)) {
      return { available: false, reason: "This username is reserved" }
    }

    // Check if username exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique()

    if (existingUser && existingUser._id !== args.currentUserId) {
      return { available: false, reason: "Username is already taken" }
    }

    return { available: true, reason: null }
  },
})

// Update public profile (server-side validated)
export const updatePublicProfile = mutation({
  args: {
    userId: v.id("users"),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    publicProfile: v.optional(v.boolean()),
    githubUsername: v.optional(v.string()),
    twitterUsername: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, username, ...rest } = args

    // Validate username server-side if provided
    if (username !== undefined) {
      const normalizedUsername = username.toLowerCase().trim()

      if (normalizedUsername.length > 0) {
        // Validate format
        if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
          throw new Error("Username must be 3-20 characters")
        }

        if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
          throw new Error("Username can only contain letters, numbers, and underscores")
        }

        // Check reserved
        const reserved = ["admin", "settings", "api", "share", "public", "profile", "user", "help", "support"]
        if (reserved.includes(normalizedUsername)) {
          throw new Error("This username is reserved")
        }

        // Check availability
        const existingUser = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
          .unique()

        if (existingUser && existingUser._id !== userId) {
          throw new Error("Username is already taken")
        }

        await ctx.db.patch(userId, {
          username: normalizedUsername,
          ...rest,
        })
      } else {
        // Clear username
        await ctx.db.patch(userId, {
          username: undefined,
          ...rest,
        })
      }
    } else {
      await ctx.db.patch(userId, rest)
    }
  },
})

// Get public profile by username (for public viewing)
export const getPublicProfile = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
      .unique()

    if (!user || !user.publicProfile) {
      return null
    }

    // Return only public-safe data
    return {
      _id: user._id,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      githubUsername: user.githubUsername,
      twitterUsername: user.twitterUsername,
      website: user.website,
    }
  },
})

// Get public bookmarks for a user's profile
export const getPublicBookmarks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .collect()

    // Only return safe fields
    return bookmarks.map((b) => ({
      _id: b._id,
      type: b.type,
      title: b.title,
      content: b.type === "link" ? b.content : undefined,
      favicon: b.favicon,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }))
  },
})

// Delete user and all associated data
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Delete all bookmarks for the user
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    for (const bookmark of bookmarks) {
      // Delete associated share if exists
      const share = await ctx.db
        .query("shares")
        .withIndex("by_bookmark", (q) => q.eq("bookmarkId", bookmark._id))
        .unique()
      if (share) {
        await ctx.db.delete(share._id)
      }
      // Delete associated file from storage if exists
      if (bookmark.fileId) {
        await ctx.storage.delete(bookmark.fileId)
      }
      await ctx.db.delete(bookmark._id)
    }

    // Delete all groups for the user
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    for (const group of groups) {
      await ctx.db.delete(group._id)
    }

    // Finally delete the user
    await ctx.db.delete(args.userId)
  },
})
