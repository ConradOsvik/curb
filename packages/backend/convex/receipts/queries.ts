import { v } from "convex/values";

import { query } from "../_generated/server";
import { authComponent } from "../auth";
import { receiptTypeValidator } from "./validators";

export const listByUser = query({
  args: {
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }
    return await ctx.db
      .query("receipts")
      .withIndex("by_folder", (q) =>
        q.eq("userId", user._id).eq("folderId", args.folderId)
      )
      .collect();
  },
});

export const listWithFilters = query({
  args: {
    amountMax: v.optional(v.number()),
    amountMin: v.optional(v.number()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
    merchantSearch: v.optional(v.string()),
    receiptType: v.optional(receiptTypeValidator),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    let receipts = await ctx.db
      .query("receipts")
      .withIndex("by_folder", (q) =>
        q.eq("userId", user._id).eq("folderId", args.folderId)
      )
      .collect();

    const { amountMax, amountMin, dateFrom, dateTo } = args;
    if (dateFrom) {
      receipts = receipts.filter((r) => r.date >= dateFrom);
    }
    if (dateTo) {
      receipts = receipts.filter((r) => r.date <= dateTo);
    }
    if (amountMin !== undefined) {
      receipts = receipts.filter((r) => r.total >= amountMin);
    }
    if (amountMax !== undefined) {
      receipts = receipts.filter((r) => r.total <= amountMax);
    }
    if (args.receiptType) {
      receipts = receipts.filter((r) => r.receiptType === args.receiptType);
    }
    if (args.merchantSearch) {
      const search = args.merchantSearch.toLowerCase();
      receipts = receipts.filter((r) =>
        r.merchantName.toLowerCase().includes(search)
      );
    }

    return receipts;
  },
});

export const get = query({
  args: {
    id: v.id("receipts"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const receipt = await ctx.db.get(args.id);
    if (!receipt || receipt.userId !== user._id) {
      return null;
    }

    return receipt;
  },
});
