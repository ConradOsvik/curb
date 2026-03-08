import { v } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { authComponent } from "../auth";

export const listByParent = query({
  args: {
    parentId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("folders")
      .withIndex("by_parent", (q) =>
        q.eq("userId", user._id).eq("parentId", args.parentId)
      )
      .collect();
  },
});

export const getPath = query({
  args: {
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    if (!args.folderId) {
      return [];
    }

    const path: { _id: Id<"folders">; name: string }[] = [];
    let currentId: Id<"folders"> | undefined = args.folderId;

    while (currentId) {
      const folderDoc: Doc<"folders"> | null = await ctx.db.get(currentId);
      if (!folderDoc || folderDoc.userId !== user._id) {
        break;
      }
      path.unshift({ _id: folderDoc._id, name: folderDoc.name });
      currentId = folderDoc.parentId;
    }

    return path;
  },
});

export const get = query({
  args: {
    id: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.userId !== user._id) {
      return null;
    }

    return folder;
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("folders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});
