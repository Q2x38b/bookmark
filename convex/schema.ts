import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  groups: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  bookmarks: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["userId", "groupId"]),
});
