import { defineSchema } from "convex/server";

import { foldersTable } from "./folders/schema";
import { receiptsTable } from "./receipts/schema";

export default defineSchema({
  folders: foldersTable,
  receipts: receiptsTable,
});
