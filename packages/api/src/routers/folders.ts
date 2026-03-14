import type { Database, Folder } from "@curb/db";
import { folders, receipts } from "@curb/db/schema";
import { and, eq, isNull, isNotNull } from "drizzle-orm";
import { z } from "zod";

/* oxlint-disable import/no-relative-parent-imports */
import { protectedProcedure, router } from "../trpc";
import { folderColorSchema } from "../validators";
/* oxlint-enable import/no-relative-parent-imports */

/** Common condition to exclude soft-deleted folders */
function notDeleted() {
  return isNull(folders.deletedAt);
}

/** Recursively soft-delete a folder and all its descendants */
async function cascadeSoftDelete(
  db: Database,
  userId: string,
  folderId: string,
  timestamp: number
) {
  // Soft-delete receipts in this folder
  await db
    .update(receipts)
    .set({ deletedAt: timestamp })
    .where(and(eq(receipts.userId, userId), eq(receipts.folderId, folderId)));

  // Find child folders and recurse
  const children = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.userId, userId), eq(folders.parentId, folderId)));

  for (const child of children) {
    await db
      .update(folders)
      .set({ deletedAt: timestamp })
      .where(eq(folders.id, child.id));
    await cascadeSoftDelete(db, userId, child.id, timestamp);
  }
}

/** Recursively restore a folder and all its descendants */
async function cascadeRestore(db: Database, userId: string, folderId: string) {
  // Restore receipts in this folder
  await db
    .update(receipts)
    .set({ deletedAt: null })
    .where(
      and(
        eq(receipts.userId, userId),
        eq(receipts.folderId, folderId),
        isNotNull(receipts.deletedAt)
      )
    );

  // Find child folders and recurse
  const children = await db
    .select({ id: folders.id })
    .from(folders)
    .where(
      and(
        eq(folders.userId, userId),
        eq(folders.parentId, folderId),
        isNotNull(folders.deletedAt)
      )
    );

  for (const child of children) {
    await db
      .update(folders)
      .set({ deletedAt: null })
      .where(eq(folders.id, child.id));
    await cascadeRestore(db, userId, child.id);
  }
}

/** Recursively permanently delete a folder and all its descendants */
async function cascadePermanentDelete(
  db: Database,
  userId: string,
  folderId: string,
  deleteStorageObject: (key: string) => Promise<void>
) {
  // Delete receipts in this folder
  const folderReceipts = await db
    .select({ id: receipts.id, storageKey: receipts.storageKey })
    .from(receipts)
    .where(and(eq(receipts.userId, userId), eq(receipts.folderId, folderId)));

  for (const receipt of folderReceipts) {
    if (receipt.storageKey) {
      await deleteStorageObject(receipt.storageKey);
    }
    await db.delete(receipts).where(eq(receipts.id, receipt.id));
  }

  // Find child folders and recurse
  const children = await db
    .select({ id: folders.id })
    .from(folders)
    .where(and(eq(folders.userId, userId), eq(folders.parentId, folderId)));

  for (const child of children) {
    await cascadePermanentDelete(db, userId, child.id, deleteStorageObject);
    await db.delete(folders).where(eq(folders.id, child.id));
  }
}

export const foldersRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        color: folderColorSchema.optional(),
        name: z.string(),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.parentId) {
        const [parent] = await ctx.db
          .select()
          .from(folders)
          .where(
            and(
              eq(folders.id, input.parentId),
              eq(folders.userId, ctx.user.id),
              notDeleted()
            )
          );
        if (!parent) {
          throw new Error("Parent folder not found");
        }
      }

      const now = Date.now();
      const [folder] = await ctx.db
        .insert(folders)
        .values({
          color: input.color,
          createdAt: now,
          name: input.name,
          order: now,
          parentId: input.parentId ?? "",
          userId: ctx.user.id,
        })
        .returning();

      return folder;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [folder] = await ctx.db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.id, input.id),
            eq(folders.userId, ctx.user.id),
            notDeleted()
          )
        );
      return folder ?? null;
    }),

  getPath: protectedProcedure
    .input(z.object({ folderId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.folderId) {
        return [];
      }

      const path: { id: string; name: string }[] = [];
      let currentId: string | null | undefined = input.folderId;

      while (currentId) {
        const [folder] = await ctx.db
          .select({
            id: folders.id,
            name: folders.name,
            parentId: folders.parentId,
          })
          .from(folders)
          .where(
            and(eq(folders.id, currentId), eq(folders.userId, ctx.user.id))
          );

        if (!folder) {
          break;
        }
        path.unshift({ id: folder.id, name: folder.name });
        currentId = folder.parentId;
      }

      return path;
    }),

  listAll: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(folders)
      .where(and(eq(folders.userId, ctx.user.id), notDeleted()))
  ),

  listByParent: protectedProcedure
    .input(z.object({ parentId: z.string().optional() }))
    .query(({ ctx, input }) =>
      ctx.db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.userId, ctx.user.id),
            input.parentId
              ? eq(folders.parentId, input.parentId)
              : eq(folders.parentId, ""),
            notDeleted()
          )
        )
    ),

  listTrash: protectedProcedure
    .input(z.object({ parentId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (input.parentId) {
        // Inside a specific trashed folder — show its trashed children
        return ctx.db
          .select()
          .from(folders)
          .where(
            and(
              eq(folders.userId, ctx.user.id),
              eq(folders.parentId, input.parentId),
              isNotNull(folders.deletedAt)
            )
          );
      }

      // Trash root: show folders whose parent is NOT also trashed
      const allTrashed = await ctx.db
        .select()
        .from(folders)
        .where(
          and(eq(folders.userId, ctx.user.id), isNotNull(folders.deletedAt))
        );

      const trashedIds = new Set(allTrashed.map((f) => f.id));
      return allTrashed.filter(
        (f) => !f.parentId || f.parentId === "" || !trashedIds.has(f.parentId)
      );
    }),

  move: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [folder] = await ctx.db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.id, input.id),
            eq(folders.userId, ctx.user.id),
            notDeleted()
          )
        );

      if (!folder) {
        throw new Error("Folder not found");
      }

      if (input.parentId) {
        const [parent] = await ctx.db
          .select()
          .from(folders)
          .where(
            and(
              eq(folders.id, input.parentId),
              eq(folders.userId, ctx.user.id),
              notDeleted()
            )
          );
        if (!parent) {
          throw new Error("Parent folder not found");
        }

        // Prevent circular move
        let currentParent: string | null | undefined = input.parentId;
        while (currentParent) {
          if (currentParent === input.id) {
            throw new Error("Cannot move folder into its own descendant");
          }
          const [parentDoc] = await ctx.db
            .select({ parentId: folders.parentId })
            .from(folders)
            .where(eq(folders.id, currentParent));
          if (!parentDoc) {
            break;
          }
          currentParent = parentDoc.parentId;
        }
      }

      await ctx.db
        .update(folders)
        .set({ order: Date.now(), parentId: input.parentId ?? "" })
        .where(eq(folders.id, input.id));

      return input.id;
    }),

  permanentDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [folder] = await ctx.db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.id, input.id),
            eq(folders.userId, ctx.user.id),
            isNotNull(folders.deletedAt)
          )
        );

      if (!folder) {
        throw new Error("Folder not found in trash");
      }

      // Recursively delete all descendants (receipts + subfolders)
      await cascadePermanentDelete(ctx.db, ctx.user.id, input.id, (key) =>
        ctx.storage.deleteObject(key)
      );

      // Delete the folder itself
      await ctx.db.delete(folders).where(eq(folders.id, input.id));
      return input.id;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [folder] = await ctx.db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.id, input.id),
            eq(folders.userId, ctx.user.id),
            notDeleted()
          )
        );

      if (!folder) {
        throw new Error("Folder not found");
      }

      const now = Date.now();

      // Soft delete the folder itself
      await ctx.db
        .update(folders)
        .set({ deletedAt: now })
        .where(eq(folders.id, input.id));

      // Recursively soft-delete all descendants
      await cascadeSoftDelete(ctx.db, ctx.user.id, input.id, now);

      return input.id;
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [folder] = await ctx.db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.id, input.id),
            eq(folders.userId, ctx.user.id),
            isNotNull(folders.deletedAt)
          )
        );

      if (!folder) {
        throw new Error("Folder not found in trash");
      }

      // Check if original parent still exists and is not deleted
      let restoreParentId = folder.parentId;
      if (restoreParentId) {
        const [parent] = await ctx.db
          .select({ deletedAt: folders.deletedAt })
          .from(folders)
          .where(
            and(
              eq(folders.id, restoreParentId),
              eq(folders.userId, ctx.user.id)
            )
          );
        // If parent doesn't exist or is also deleted, restore to root
        if (!parent || parent.deletedAt !== null) {
          restoreParentId = "";
        }
      }

      // Restore the folder (preserving original parent when possible)
      await ctx.db
        .update(folders)
        .set({ deletedAt: null, parentId: restoreParentId })
        .where(eq(folders.id, input.id));

      // Recursively restore all descendants
      await cascadeRestore(ctx.db, ctx.user.id, input.id);

      return input.id;
    }),

  update: protectedProcedure
    .input(
      z.object({
        color: folderColorSchema.optional(),
        id: z.string(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [folder] = await ctx.db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.id, input.id),
            eq(folders.userId, ctx.user.id),
            notDeleted()
          )
        );

      if (!folder) {
        throw new Error("Folder not found");
      }

      const updates: Partial<Folder> = {};
      if (input.name !== undefined) {
        updates.name = input.name;
      }
      if (input.color !== undefined) {
        updates.color = input.color;
      }

      await ctx.db.update(folders).set(updates).where(eq(folders.id, input.id));
      return input.id;
    }),
});
