import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const folders = sqliteTable(
  "folders",
  {
    color: text("color"),
    createdAt: integer("created_at").$defaultFn(() => Date.now()),
    deletedAt: integer("deleted_at"),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    order: integer("order"),
    parentId: text("parent_id"),
    userId: text("user_id").notNull(),
  },
  (table) => [
    index("folders_user_idx").on(table.userId),
    index("folders_user_parent_idx").on(table.userId, table.parentId),
  ]
);
