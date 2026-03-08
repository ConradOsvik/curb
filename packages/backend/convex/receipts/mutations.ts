import { v } from "convex/values";

import { internalMutation, mutation } from "../_generated/server";
import { authComponent } from "../auth";
import { receiptItemValidator, receiptTypeValidator } from "./validators";

export const insertReceipt = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) =>
    await ctx.db.insert("receipts", {
      ...args,
      order: args.order ?? Date.now(),
    }),
});

export const moveToFolder = mutation({
  args: {
    folderId: v.optional(v.id("folders")),
    id: v.id("receipts"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const receipt = await ctx.db.get(args.id);
    if (!receipt || receipt.userId !== user._id) {
      throw new Error("Receipt not found");
    }

    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder || folder.userId !== user._id) {
        throw new Error("Folder not found");
      }
    }

    await ctx.db.patch(args.id, { folderId: args.folderId, order: Date.now() });
    return args.id;
  },
});

export const deleteReceipt = mutation({
  args: {
    id: v.id("receipts"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const receipt = await ctx.db.get(args.id);
    if (!receipt || receipt.userId !== user._id) {
      throw new Error("Receipt not found");
    }

    if (receipt.storageId) {
      await ctx.storage.delete(receipt.storageId);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const reorder = mutation({
  args: {
    items: v.array(
      v.object({
        id: v.id("receipts"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    for (const { id, order } of args.items) {
      const receipt = await ctx.db.get(id);
      if (receipt && receipt.userId === user._id) {
        await ctx.db.patch(id, { order });
      }
    }
  },
});
