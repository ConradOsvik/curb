import { folders, receipts } from "@curb/db/schema";
import type { Folder } from "@curb/db/types";
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

  listAll: protectedProcedure.query(
    async ({ ctx }) =>
      await ctx.db
        .select()
        .from(folders)
        .where(and(eq(folders.userId, ctx.user.id), notDeleted()))
  ),

  listByParent: protectedProcedure
    .input(z.object({ parentId: z.string().optional() }))
    .query(
      async ({ ctx, input }) =>
        await ctx.db
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

  listTrash: protectedProcedure.query(
    async ({ ctx }) =>
      await ctx.db
        .select()
        .from(folders)
        .where(
          and(eq(folders.userId, ctx.user.id), isNotNull(folders.deletedAt))
        )
  ),

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

      // Move child folders to root
      await ctx.db
        .update(folders)
        .set({ parentId: "" })
        .where(
          and(eq(folders.userId, ctx.user.id), eq(folders.parentId, input.id))
        );

      // Move receipts to root
      await ctx.db
        .update(receipts)
        .set({ folderId: "" })
        .where(
          and(eq(receipts.userId, ctx.user.id), eq(receipts.folderId, input.id))
        );

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

      // Soft delete: set deletedAt timestamp
      await ctx.db
        .update(folders)
        .set({ deletedAt: Date.now() })
        .where(eq(folders.id, input.id));

      // Also soft-delete contents (child folders + receipts)
      const childFolders = await ctx.db
        .select()
        .from(folders)
        .where(
          and(eq(folders.userId, ctx.user.id), eq(folders.parentId, input.id))
        );

      for (const child of childFolders) {
        await ctx.db
          .update(folders)
          .set({ deletedAt: Date.now() })
          .where(eq(folders.id, child.id));
      }

      await ctx.db
        .update(receipts)
        .set({ deletedAt: Date.now() })
        .where(
          and(eq(receipts.userId, ctx.user.id), eq(receipts.folderId, input.id))
        );

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

      // Restore to root (original parent may no longer exist)
      await ctx.db
        .update(folders)
        .set({ deletedAt: null, parentId: "" })
        .where(eq(folders.id, input.id));

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
