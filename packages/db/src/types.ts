import type { folders } from "./schema/folders";
import type { receipts } from "./schema/receipts";

export interface ReceiptItem {
  name: string;
  totalPrice: number;
  quantity?: number;
  unitPrice?: number;
  isDeposit?: boolean;
  isDiscount?: boolean;
}

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;
