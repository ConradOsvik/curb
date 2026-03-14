import type { Database } from "@curb/db";
import { sheetCells, sheets } from "@curb/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

/* oxlint-disable import/no-relative-parent-imports */
import { protectedProcedure, router } from "../trpc";
/* oxlint-enable import/no-relative-parent-imports */

export const sheetsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        description: z.string().optional(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const [sheet] = await ctx.db
        .insert(sheets)
        .values({
          createdAt: now,
          description: input.description ?? null,
          name: input.name,
          updatedAt: now,
          userId: ctx.user.id,
        })
        .returning();

      if (!sheet) {
        throw new Error("Failed to create sheet");
      }

      return sheet;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(ctx, input.id);
      await ctx.db.delete(sheets).where(eq(sheets.id, input.id));
      return input.id;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [sheet] = await ctx.db
        .select()
        .from(sheets)
        .where(and(eq(sheets.id, input.id), eq(sheets.userId, ctx.user.id)));

      if (!sheet) {
        return null;
      }

      const cells = await ctx.db
        .select()
        .from(sheetCells)
        .where(eq(sheetCells.sheetId, input.id));

      return { ...sheet, cells };
    }),

  list: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(sheets)
      .where(eq(sheets.userId, ctx.user.id))
      .orderBy(sheets.createdAt)
  ),

  update: protectedProcedure
    .input(
      z.object({
        description: z.string().optional(),
        id: z.string(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(ctx, input.id);
      const updates: Record<string, unknown> = { updatedAt: Date.now() };
      if (input.name !== undefined) {
        updates.name = input.name;
      }
      if (input.description !== undefined) {
        updates.description = input.description;
      }
      await ctx.db.update(sheets).set(updates).where(eq(sheets.id, input.id));
      return input.id;
    }),

  updateCells: protectedProcedure
    .input(
      z.object({
        cells: z.array(
          z.object({
            col: z.number().int().min(0),
            row: z.number().int().min(0),
            value: z.string(),
          })
        ),
        sheetId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(ctx, input.sheetId);

      for (const cell of input.cells) {
        if (cell.value === "") {
          await ctx.db
            .delete(sheetCells)
            .where(
              and(
                eq(sheetCells.sheetId, input.sheetId),
                eq(sheetCells.row, cell.row),
                eq(sheetCells.col, cell.col)
              )
            );
        } else {
          const [existing] = await ctx.db
            .select({ id: sheetCells.id })
            .from(sheetCells)
            .where(
              and(
                eq(sheetCells.sheetId, input.sheetId),
                eq(sheetCells.row, cell.row),
                eq(sheetCells.col, cell.col)
              )
            );

          await (existing
            ? ctx.db
                .update(sheetCells)
                .set({ value: cell.value })
                .where(eq(sheetCells.id, existing.id))
            : ctx.db.insert(sheetCells).values({
                col: cell.col,
                row: cell.row,
                sheetId: input.sheetId,
                value: cell.value,
              }));
        }
      }

      return input.sheetId;
    }),

  updateLayout: protectedProcedure
    .input(
      z.object({
        colWidths: z.record(z.coerce.number(), z.number()).optional(),
        id: z.string(),
        rowHeights: z.record(z.coerce.number(), z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(ctx, input.id);
      const updates: Record<string, unknown> = { updatedAt: Date.now() };
      if (input.colWidths !== undefined) {
        updates.colWidths = JSON.stringify(input.colWidths);
      }
      if (input.rowHeights !== undefined) {
        updates.rowHeights = JSON.stringify(input.rowHeights);
      }
      await ctx.db.update(sheets).set(updates).where(eq(sheets.id, input.id));
      return input.id;
    }),
});

async function verifyOwnership(
  ctx: { db: Database; user: { id: string } },
  sheetId: string
) {
  const [sheet] = await ctx.db
    .select({ id: sheets.id })
    .from(sheets)
    .where(and(eq(sheets.id, sheetId), eq(sheets.userId, ctx.user.id)));
  if (!sheet) {
    throw new Error("Sheet not found");
  }
}
