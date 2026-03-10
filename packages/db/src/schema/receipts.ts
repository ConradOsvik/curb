import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

// oxlint-disable-next-line import/no-relative-parent-imports
import type { ReceiptItem } from "../types";

export const receipts = sqliteTable(
  "receipts",
  {
    cardLastFour: text("card_last_four"),
    createdAt: integer("created_at").$defaultFn(() => Date.now()),
    currency: text("currency").notNull().default("USD"),
    date: text("date").notNull(),
    deletedAt: integer("deleted_at"),
    discount: real("discount"),
    fees: real("fees"),
    folderId: text("folder_id"),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    imageUrl: text("image_url"),
    items: text("items", { mode: "json" }).$type<ReceiptItem[]>().notNull(),
    merchantAddress: text("merchant_address"),
    merchantName: text("merchant_name").notNull(),
    merchantPhone: text("merchant_phone"),
    order: integer("order"),
    paymentMethod: text("payment_method"),
    receiptNumber: text("receipt_number"),
    receiptType: text("receipt_type").notNull(),
    storageKey: text("storage_key"),
    subtotal: real("subtotal"),
    tax: real("tax"),
    time: text("time"),
    tip: real("tip"),
    total: real("total").notNull(),
    userId: text("user_id").notNull(),
  },
  (table) => [
    index("receipts_user_idx").on(table.userId),
    index("receipts_user_folder_idx").on(table.userId, table.folderId),
  ]
);
