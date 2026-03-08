import { v } from "convex/values";
import { z } from "zod";

// Convex validators for database operations
export const receiptItemValidator = v.object({
  isDeposit: v.optional(v.boolean()),
  isDiscount: v.optional(v.boolean()),
  name: v.string(),
  quantity: v.optional(v.number()),
  totalPrice: v.number(),
  unitPrice: v.optional(v.number()),
});

export const receiptTypeValidator = v.union(
  v.literal("retail"),
  v.literal("restaurant"),
  v.literal("service"),
  v.literal("utility"),
  v.literal("online"),
  v.literal("other")
);

export const receiptValidator = v.object({
  cardLastFour: v.optional(v.string()),
  currency: v.string(),
  date: v.string(),
  discount: v.optional(v.number()),
  fees: v.optional(v.number()),
  imageUrl: v.string(),
  items: v.array(receiptItemValidator),
  merchantAddress: v.optional(v.string()),
  merchantName: v.string(),
  merchantPhone: v.optional(v.string()),
  paymentMethod: v.optional(v.string()),
  receiptNumber: v.optional(v.string()),
  receiptType: receiptTypeValidator,
  subtotal: v.optional(v.number()),
  tax: v.optional(v.number()),
  time: v.optional(v.string()),
  tip: v.optional(v.number()),
  total: v.number(),
  userId: v.string(),
});

// Zod schemas for AI SDK structured output
export const receiptItemZodSchema = z.object({
  isDeposit: z
    .boolean()
    .optional()
    .describe("True if this is a deposit fee (e.g., bottle deposit)"),
  isDiscount: z
    .boolean()
    .optional()
    .describe("True if this is a discount/refund (negative amount)"),
  name: z
    .string()
    .describe(
      "Clean product/service name. Fix OCR errors and remove retailer codes. Use proper capitalization."
    ),
  quantity: z.number().optional().describe("Quantity purchased, defaults to 1"),
  totalPrice: z.number().describe("Total price for this line item"),
  unitPrice: z.number().optional().describe("Price per single unit"),
});

export const receiptZodSchema = z.object({
  cardLastFour: z.string().optional().describe("Last 4 digits of payment card"),
  currency: z.string().default("USD").describe("Currency code"),
  date: z.string().describe("Transaction date in YYYY-MM-DD format"),
  discount: z.number().optional().describe("Total discount amount"),
  fees: z.number().optional().describe("Additional fees"),
  items: z
    .array(receiptItemZodSchema)
    .describe(
      "List of purchased items. Each item must have its own price. Do NOT include subtotal/tax/total lines."
    ),
  merchantAddress: z.string().optional().describe("Full business address"),
  merchantName: z.string().describe("Name of the business/merchant"),
  merchantPhone: z.string().optional().describe("Business phone number"),
  paymentMethod: z.string().optional().describe("Payment method used"),
  receiptNumber: z
    .string()
    .optional()
    .describe("Receipt or transaction number"),
  receiptType: z
    .enum(["retail", "restaurant", "service", "utility", "online", "other"])
    .describe("Type of receipt"),
  subtotal: z.number().optional().describe("Subtotal before taxes and fees"),
  tax: z.number().optional().describe("Total tax/VAT amount"),
  time: z.string().optional().describe("Transaction time in HH:MM format"),
  tip: z.number().optional().describe("Tip amount"),
  total: z.number().describe("Final total amount paid"),
});

export const receiptsResponseZodSchema = z.object({
  count: z.number().describe("Total number of receipts found"),
  receipts: z
    .array(receiptZodSchema)
    .describe("Array of all receipts found in the image"),
});

export type ReceiptItem = z.infer<typeof receiptItemZodSchema>;
export type Receipt = z.infer<typeof receiptZodSchema>;
export type ReceiptsResponse = z.infer<typeof receiptsResponseZodSchema>;
