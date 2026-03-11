import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { folders, receipts } from "@curb/db/schema";
import { env } from "@curb/env/server";
import { storage } from "@curb/storage";
import { generateText, Output } from "ai";
import { and, eq, gte, isNotNull, isNull, like, lte } from "drizzle-orm";
import { z } from "zod";

/* oxlint-disable import/no-relative-parent-imports */
import { protectedProcedure, router } from "../trpc";
import {
  receiptsResponseZodSchema,
  type ExtractedReceipt,
} from "../validators";
/* oxlint-enable import/no-relative-parent-imports */

const EXTRACTION_PROMPT = `Extract data from all receipts in this image.

RULES:
1. Only extract lines with BOTH a product name AND a price
2. Clean product names: fix typos, remove codes (FL, S, etc.), use proper capitalization
3. Mark deposits (PANT) with isDeposit: true
4. Mark discounts/refunds (negative prices) with isDiscount: true
5. Don't duplicate items - each line item appears once
6. Don't extract summary lines (subtotal, tax, total) as items
7. If something is unclear, skip it rather than guess
8. Match prices exactly as shown

Be precise and consistent.`;

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

async function extractReceiptsFromImage(base64: string) {
  const google = createGoogleGenerativeAI({
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  const { output } = await generateText({
    messages: [
      {
        content: [
          { text: EXTRACTION_PROMPT, type: "text" },
          { image: base64, type: "image" },
        ],
        role: "user",
      },
    ],
    model: google("gemini-3.1-flash-lite-preview"),
    output: Output.object({ schema: receiptsResponseZodSchema }),
  });

  if (!output) {
    throw new Error("Failed to extract receipt data");
  }
  return output;
}

function getImageUrlFromKey(storageKey: string): string {
  const url = storage.getPublicUrl(storageKey);
  if (url) {
    return url;
  }
  throw new Error("S3_PUBLIC_URL is required for image access");
}

function receiptToInsert(receipt: ExtractedReceipt) {
  return {
    cardLastFour: receipt.cardLastFour,
    currency: receipt.currency,
    date: receipt.date,
    discount: receipt.discount,
    fees: receipt.fees,
    items: receipt.items.map((item) => ({
      isDeposit: item.isDeposit,
      isDiscount: item.isDiscount,
      name: item.name,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      unitPrice: item.unitPrice,
    })),
    merchantAddress: receipt.merchantAddress,
    merchantName: receipt.merchantName,
    merchantPhone: receipt.merchantPhone,
    paymentMethod: receipt.paymentMethod,
    receiptNumber: receipt.receiptNumber,
    receiptType: receipt.receiptType,
    subtotal: receipt.subtotal,
    tax: receipt.tax,
    time: receipt.time,
    tip: receipt.tip,
    total: receipt.total,
  };
}

function notDeleted() {
  return isNull(receipts.deletedAt);
}

export const receiptsRouter = router({
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [receipt] = await ctx.db
        .select()
        .from(receipts)
        .where(
          and(
            eq(receipts.id, input.id),
            eq(receipts.userId, ctx.user.id),
            notDeleted()
          )
        );

      if (!receipt) {
        throw new Error("Receipt not found");
      }

      // Soft delete
      await ctx.db
        .update(receipts)
        .set({ deletedAt: Date.now() })
        .where(eq(receipts.id, input.id));
      return input.id;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [receipt] = await ctx.db
        .select()
        .from(receipts)
        .where(
          and(eq(receipts.id, input.id), eq(receipts.userId, ctx.user.id))
        );
      return receipt ?? null;
    }),

  list: protectedProcedure
    .input(z.object({ folderId: z.string().optional() }))
    .query(
      async ({ ctx, input }) =>
        await ctx.db
          .select()
          .from(receipts)
          .where(
            and(
              eq(receipts.userId, ctx.user.id),
              input.folderId
                ? eq(receipts.folderId, input.folderId)
                : eq(receipts.folderId, ""),
              notDeleted()
            )
          )
    ),

  listTrash: protectedProcedure.query(
    async ({ ctx }) =>
      await ctx.db
        .select()
        .from(receipts)
        .where(
          and(eq(receipts.userId, ctx.user.id), isNotNull(receipts.deletedAt))
        )
  ),

  listWithFilters: protectedProcedure
    .input(
      z.object({
        amountMax: z.number().optional(),
        amountMin: z.number().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        folderId: z.string().optional(),
        merchantSearch: z.string().optional(),
        receiptType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(receipts.userId, ctx.user.id),
        input.folderId
          ? eq(receipts.folderId, input.folderId)
          : eq(receipts.folderId, ""),
        notDeleted(),
      ];

      if (input.dateFrom) {
        conditions.push(gte(receipts.date, input.dateFrom));
      }
      if (input.dateTo) {
        conditions.push(lte(receipts.date, input.dateTo));
      }
      if (input.amountMin !== undefined) {
        conditions.push(gte(receipts.total, input.amountMin));
      }
      if (input.amountMax !== undefined) {
        conditions.push(lte(receipts.total, input.amountMax));
      }
      if (input.receiptType) {
        conditions.push(eq(receipts.receiptType, input.receiptType));
      }
      if (input.merchantSearch) {
        conditions.push(
          like(receipts.merchantName, `%${input.merchantSearch}%`)
        );
      }

      return await ctx.db
        .select()
        .from(receipts)
        .where(and(...conditions));
    }),

  move: protectedProcedure
    .input(
      z.object({
        folderId: z.string().optional(),
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [receipt] = await ctx.db
        .select()
        .from(receipts)
        .where(
          and(
            eq(receipts.id, input.id),
            eq(receipts.userId, ctx.user.id),
            notDeleted()
          )
        );

      if (!receipt) {
        throw new Error("Receipt not found");
      }

      if (input.folderId) {
        const [folder] = await ctx.db
          .select()
          .from(folders)
          .where(
            and(eq(folders.id, input.folderId), eq(folders.userId, ctx.user.id))
          );
        if (!folder) {
          throw new Error("Folder not found");
        }
      }

      await ctx.db
        .update(receipts)
        .set({ folderId: input.folderId ?? "", order: Date.now() })
        .where(eq(receipts.id, input.id));

      return input.id;
    }),

  permanentDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [receipt] = await ctx.db
        .select()
        .from(receipts)
        .where(
          and(
            eq(receipts.id, input.id),
            eq(receipts.userId, ctx.user.id),
            isNotNull(receipts.deletedAt)
          )
        );

      if (!receipt) {
        throw new Error("Receipt not found in trash");
      }

      if (receipt.storageKey) {
        await storage.deleteObject(receipt.storageKey);
      }

      await ctx.db.delete(receipts).where(eq(receipts.id, input.id));
      return input.id;
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [receipt] = await ctx.db
        .select()
        .from(receipts)
        .where(
          and(
            eq(receipts.id, input.id),
            eq(receipts.userId, ctx.user.id),
            isNotNull(receipts.deletedAt)
          )
        );

      if (!receipt) {
        throw new Error("Receipt not found in trash");
      }

      // Restore to root
      await ctx.db
        .update(receipts)
        .set({ deletedAt: null, folderId: "" })
        .where(eq(receipts.id, input.id));

      return input.id;
    }),

  scan: protectedProcedure
    .input(
      z.object({
        folderId: z.string().optional(),
        imageUrl: z.string().optional(),
        storageKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.imageUrl && !input.storageKey) {
        throw new Error("Either imageUrl or storageKey is required");
      }

      let base64: string;
      let { imageUrl } = input;

      if (input.storageKey) {
        imageUrl = getImageUrlFromKey(input.storageKey);
        base64 = await fetchImageAsBase64(imageUrl);
      } else if (imageUrl) {
        base64 = await fetchImageAsBase64(imageUrl);
      } else {
        throw new Error("Either imageUrl or storageKey is required");
      }

      const output = await extractReceiptsFromImage(base64);

      const receiptIds: string[] = [];
      for (const receipt of output.receipts) {
        const [inserted] = await ctx.db
          .insert(receipts)
          .values({
            ...receiptToInsert(receipt),
            folderId: input.folderId ?? "",
            imageUrl,
            order: Date.now(),
            storageKey: input.storageKey,
            userId: ctx.user.id,
          })
          .returning({ id: receipts.id });

        if (inserted) {
          receiptIds.push(inserted.id);
        }
      }

      if (input.storageKey && receiptIds.length > 0) {
        await storage.confirmObject(input.storageKey);
      }

      return { ...output, receiptIds };
    }),
});
