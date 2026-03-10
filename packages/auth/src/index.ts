import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import { db } from "@curb/db";
import { env } from "@curb/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  baseURL: env.SITE_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [expo(), passkey()],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  trustedOrigins: [
    env.SITE_URL ?? "http://localhost:3000",
    env.NATIVE_APP_URL ?? "curb://",
  ],
});

export type Auth = typeof auth;
