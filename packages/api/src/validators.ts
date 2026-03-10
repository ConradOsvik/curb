import { z } from "zod";

export const folderColorSchema = z.enum([
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "gray",
]);

export type FolderColor = z.infer<typeof folderColorSchema>;

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

export type ReceiptItem = z.infer<typeof receiptItemZodSchema>;

export const receiptTypeSchema = z.enum([
  "retail",
  "restaurant",
  "service",
  "utility",
  "online",
  "other",
]);

export type ReceiptType = z.infer<typeof receiptTypeSchema>;

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
  receiptType: receiptTypeSchema.describe("Type of receipt"),
  subtotal: z.number().optional().describe("Subtotal before taxes and fees"),
  tax: z.number().optional().describe("Total tax/VAT amount"),
  time: z.string().optional().describe("Transaction time in HH:MM format"),
  tip: z.number().optional().describe("Tip amount"),
  total: z.number().describe("Final total amount paid"),
});

export type ExtractedReceipt = z.infer<typeof receiptZodSchema>;

export const receiptsResponseZodSchema = z.object({
  count: z.number().describe("Total number of receipts found"),
  receipts: z
    .array(receiptZodSchema)
    .describe("Array of all receipts found in the image"),
});

export type ReceiptsResponse = z.infer<typeof receiptsResponseZodSchema>;
