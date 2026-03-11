import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const isLocal = !process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  dbCredentials: isLocal
    ? { url: process.env.TURSO_DATABASE_URL ?? "file:local.db" }
    : {
        authToken: process.env.TURSO_AUTH_TOKEN ?? "",
        url: process.env.TURSO_DATABASE_URL ?? "",
      },
  dialect: isLocal ? "sqlite" : "turso",
  out: "./drizzle",
  schema: "./src/schema",
});
