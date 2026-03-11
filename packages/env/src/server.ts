import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

function findRootEnv(): string | undefined {
  // Walk up from this package's directory to find the monorepo root .env
  let dir = resolve(import.meta.dirname, "..");
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

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    BETTER_AUTH_SECRET: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    NATIVE_APP_URL: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    RESEND_API_KEY: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_BUCKET_NAME: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_PUBLIC_URL: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    SITE_URL: z.string().optional(),
    TURSO_AUTH_TOKEN: z.string().optional(),
    TURSO_DATABASE_URL: z.string().optional(),
  },
});
