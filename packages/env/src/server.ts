import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { config } from "@dotenvx/dotenvx";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

function loadRootEnv() {
  let dir = resolve(import.meta.dirname, "..");
  while (true) {
    const candidate = join(dir, ".env");
    if (existsSync(candidate)) {
      config({ override: true, path: candidate });
      return;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return;
    }
    dir = parent;
  }
}

loadRootEnv();

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
    POLAR_ACCESS_TOKEN: z.string(),
    POLAR_SUCCESS_URL: z.string(),
    POLAR_WEBHOOK_SECRET: z.string(),
    RESEND_API_KEY: z.string(),
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
