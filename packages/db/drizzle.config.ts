import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { config } from "@dotenvx/dotenvx";
import { defineConfig } from "drizzle-kit";

// Replicate findRootEnv using __dirname (available in CJS, which drizzle-kit uses)
function findRootEnv(): string | undefined {
  let dir = resolve(__dirname, "..");
  while (true) {
    const candidate = join(dir, ".env");
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
}

config({ override: true, path: findRootEnv() });

export default defineConfig({
  dbCredentials: {
    authToken: process.env.DATABASE_TOKEN,
    url: process.env.DATABASE_URL ?? "",
  },
  dialect: "turso",
  out: "./drizzle",
  schema: "./src/schema",
});
