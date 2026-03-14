import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const sheets = sqliteTable(
  "sheets",
  {
    colWidths: text("col_widths"),
    createdAt: integer("created_at").$defaultFn(() => Date.now()),
    description: text("description"),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    rowHeights: text("row_heights"),
    updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
    userId: text("user_id").notNull(),
  },
  (table) => [index("sheets_user_idx").on(table.userId)]
);

export const sheetCells = sqliteTable(
  "sheet_cells",
  {
    col: integer("col").notNull(),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    row: integer("row").notNull(),
    sheetId: text("sheet_id")
      .notNull()
      .references(() => sheets.id, { onDelete: "cascade" }),
    value: text("value").notNull().default(""),
  },
  (table) => [
    index("sheet_cells_sheet_idx").on(table.sheetId),
    uniqueIndex("sheet_cells_pos_idx").on(table.sheetId, table.row, table.col),
  ]
);
