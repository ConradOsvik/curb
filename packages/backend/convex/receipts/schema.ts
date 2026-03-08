import { defineTable } from "convex/server";
import { v } from "convex/values";

import { receiptItemValidator, receiptTypeValidator } from "./validators";

export const receiptsTable = defineTable({
  cardLastFour: v.optional(v.string()),
  currency: v.string(),
  date: v.string(),
  discount: v.optional(v.number()),
  fees: v.optional(v.number()),
  folderId: v.optional(v.id("folders")),
  imageUrl: v.optional(v.string()),
  items: v.array(receiptItemValidator),
  merchantAddress: v.optional(v.string()),
  merchantName: v.string(),
  merchantPhone: v.optional(v.string()),
  order: v.optional(v.number()),
  paymentMethod: v.optional(v.string()),
  receiptNumber: v.optional(v.string()),
  receiptType: receiptTypeValidator,
  storageId: v.optional(v.id("_storage")),
  subtotal: v.optional(v.number()),
  tax: v.optional(v.number()),
  time: v.optional(v.string()),
  tip: v.optional(v.number()),
  total: v.number(),
  userId: v.string(),
})
  .index("by_user", ["userId"])
  .index("by_folder", ["userId", "folderId"]);
