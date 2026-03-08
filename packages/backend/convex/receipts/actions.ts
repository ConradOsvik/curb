"use node";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { v } from "convex/values";

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, type ActionCtx } from "../_generated/server";
import { authComponent } from "../auth";
import { type Receipt, receiptsResponseZodSchema } from "./validators";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

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
    model: google("gemini-3-flash-preview"),
    output: Output.object({ schema: receiptsResponseZodSchema }),
  });

  if (!output) {
    throw new Error("Failed to extract receipt data");
  }
  return output;
}

async function saveReceipts(
  ctx: ActionCtx,
  receipts: Receipt[],
  userId: string,
  options: {
    imageUrl?: string;
    storageId?: Id<"_storage">;
    folderId?: Id<"folders">;
  }
): Promise<string[]> {
  const receiptIds: string[] = [];
  for (const receipt of receipts) {
    const id = await ctx.runMutation(
      internal.receipts.mutations.insertReceipt,
      {
        ...receipt,
        folderId: options.folderId,
        imageUrl: options.imageUrl,
        storageId: options.storageId,
        userId,
      }
    );
    receiptIds.push(id);
  }
  return receiptIds;
}

export const scan = action({
  args: {
    folderId: v.optional(v.id("folders")),
    imageUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (!args.imageUrl && !args.storageId) {
      throw new Error("Either imageUrl or storageId is required");
    }

    let base64: string;
    const { imageUrl } = args;

    if (args.storageId) {
      const url = await ctx.storage.getUrl(args.storageId);
      if (!url) {
        throw new Error("Storage file not found");
      }
      base64 = await fetchImageAsBase64(url);
    } else if (imageUrl) {
      base64 = await fetchImageAsBase64(imageUrl);
    } else {
      throw new Error("Either imageUrl or storageId is required");
    }

    const output = await extractReceiptsFromImage(base64);
    const receiptIds = await saveReceipts(ctx, output.receipts, user._id, {
      folderId: args.folderId,
      imageUrl,
      storageId: args.storageId,
    });

    return { ...output, receiptIds };
  },
});
