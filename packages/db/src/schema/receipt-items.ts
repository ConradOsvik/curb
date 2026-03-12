import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

import { receipts } from "./receipts";

export const receiptItems = sqliteTable(
  "receipt_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    isDeposit: integer("is_deposit", { mode: "boolean" }),
    isDiscount: integer("is_discount", { mode: "boolean" }),
    name: text("name").notNull(),
    quantity: real("quantity"),
    receiptId: text("receipt_id")
      .notNull()
      .references(() => receipts.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    totalPrice: real("total_price").notNull(),
    unitPrice: real("unit_price"),
  },
  (table) => [index("receipt_items_receipt_idx").on(table.receiptId)]
);
