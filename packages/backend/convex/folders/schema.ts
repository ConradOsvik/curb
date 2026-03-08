import { defineTable } from "convex/server";
import { v } from "convex/values";

export const foldersTable = defineTable({
  color: v.optional(v.string()),
  createdAt: v.number(),
  name: v.string(),
  order: v.optional(v.number()),
  parentId: v.optional(v.id("folders")),
  userId: v.string(),
})
  .index("by_user", ["userId"])
  .index("by_parent", ["userId", "parentId"]);
