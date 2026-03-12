import { env } from "@curb/env/server";
import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema/index";

const client = createClient({
  authToken: env.DATABASE_TOKEN,
  url: env.DATABASE_URL,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
export { folders, receiptItems, receipts } from "./schema/index";

export type Folder = typeof schema.folders.$inferSelect;
export type NewFolder = typeof schema.folders.$inferInsert;
export type Receipt = typeof schema.receipts.$inferSelect;
export type NewReceipt = typeof schema.receipts.$inferInsert;
export type ReceiptItem = typeof schema.receiptItems.$inferSelect;
export type NewReceiptItem = typeof schema.receiptItems.$inferInsert;
