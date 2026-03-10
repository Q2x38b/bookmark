import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
    keyboardShortcuts: v.optional(
      v.object({
        focusSearch: v.optional(v.string()),
        copyBookmark: v.optional(v.string()),
        renameBookmark: v.optional(v.string()),
        deleteBookmark: v.optional(v.string()),
        selectAll: v.optional(v.string()),
        toggleSelect: v.optional(v.string()),
        navigateUp: v.optional(v.string()),
        navigateDown: v.optional(v.string()),
        exitSelection: v.optional(v.string()),
      })
    ),
    // Public profile fields
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    publicProfile: v.optional(v.boolean()),
    githubUsername: v.optional(v.string()),
    twitterUsername: v.optional(v.string()),
    website: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  groups: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    order: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_order", ["userId", "order"]),

  bookmarks: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    type: v.union(
      v.literal("link"),
      v.literal("note"),
      v.literal("color"),
      v.literal("image"),
      v.literal("file"),
      v.literal("text")
    ),
    title: v.string(),
    content: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileType: v.optional(v.string()),
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
    shareId: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_group", ["groupId"])
    .index("by_user_group", ["userId", "groupId"])
    .index("by_share_id", ["shareId"])
    .index("by_user_public", ["userId", "isPublic"])
    .searchIndex("search_bookmarks", {
      searchField: "title",
      filterFields: ["userId", "groupId"],
    }),

  shares: defineTable({
    bookmarkId: v.id("bookmarks"),
    shareId: v.string(),
    slug: v.optional(v.string()),
    password: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    isUnsafe: v.optional(v.boolean()),
    createdAt: v.number(),
    viewCount: v.optional(v.number()),
  })
    .index("by_bookmark", ["bookmarkId"])
    .index("by_share_id", ["shareId"])
    .index("by_slug", ["slug"]),

  bookmarkHistory: defineTable({
    bookmarkId: v.optional(v.id("bookmarks")),
    userId: v.id("users"),
    action: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("moved"),
      v.literal("deleted")
    ),
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
      type: v.optional(v.union(
        v.literal("link"),
        v.literal("note"),
        v.literal("color"),
        v.literal("image"),
        v.literal("file"),
        v.literal("text")
      )),
      url: v.optional(v.string()),
      favicon: v.optional(v.string()),
    }),
    createdAt: v.number(),
  })
    .index("by_bookmark", ["bookmarkId"])
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"])
    .index("by_bookmark_date", ["bookmarkId", "createdAt"]),
})
