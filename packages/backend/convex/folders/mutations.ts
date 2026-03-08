import { v } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { authComponent } from "../auth";
import { folderColorValidator } from "./validators";

export const create = mutation({
  args: {
    color: v.optional(folderColorValidator),
    name: v.string(),
    parentId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (args.parentId) {
      const parentFolder = await ctx.db.get(args.parentId);
      if (!parentFolder || parentFolder.userId !== user._id) {
        throw new Error("Parent folder not found");
      }
    }

    return await ctx.db.insert("folders", {
      color: args.color,
      createdAt: Date.now(),
      name: args.name,
      order: Date.now(),
      parentId: args.parentId,
      userId: user._id,
    });
  },
});

export const update = mutation({
  args: {
    color: v.optional(folderColorValidator),
    id: v.id("folders"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.userId !== user._id) {
      throw new Error("Folder not found");
    }

    const updates: { name?: string; color?: string } = {};
    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.color !== undefined) {
      updates.color = args.color;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const move = mutation({
  args: {
    id: v.id("folders"),
    parentId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.userId !== user._id) {
      throw new Error("Folder not found");
    }

    if (args.parentId) {
      const parentFolder = await ctx.db.get(args.parentId);
      if (!parentFolder || parentFolder.userId !== user._id) {
        throw new Error("Parent folder not found");
      }

      let currentParent: Id<"folders"> | undefined = args.parentId;
      while (currentParent) {
        if (currentParent === args.id) {
          throw new Error("Cannot move folder into its own descendant");
        }
        const parentDoc: Doc<"folders"> | null =
          await ctx.db.get(currentParent);
        if (!parentDoc) {
          break;
        }
        currentParent = parentDoc.parentId;
      }
    }

    await ctx.db.patch(args.id, { order: Date.now(), parentId: args.parentId });
    return args.id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.userId !== user._id) {
      throw new Error("Folder not found");
    }

    const childFolders = await ctx.db
      .query("folders")
      .withIndex("by_parent", (q) =>
        q.eq("userId", user._id).eq("parentId", args.id)
      )
      .collect();

    for (const child of childFolders) {
      await ctx.db.patch(child._id, { parentId: folder.parentId });
    }

    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_folder", (q) =>
        q.eq("userId", user._id).eq("folderId", args.id)
      )
      .collect();

    for (const receipt of receipts) {
      await ctx.db.patch(receipt._id, { folderId: folder.parentId });
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const reorder = mutation({
  args: {
    items: v.array(
      v.object({
        id: v.id("folders"),
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
      const folder = await ctx.db.get(id);
      if (folder && folder.userId === user._id) {
        await ctx.db.patch(id, { order });
      }
    }
  },
});
