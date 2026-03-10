import { env } from "@curb/env/server";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema/index";

const client = createClient({
  authToken: env.TURSO_AUTH_TOKEN,
  url: env.TURSO_DATABASE_URL || `file:${import.meta.dirname}/../local.db`,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
export { folders, receipts } from "./schema/index";
export type {
  Folder,
  NewFolder,
  NewReceipt,
  Receipt,
  ReceiptItem,
} from "./types";
