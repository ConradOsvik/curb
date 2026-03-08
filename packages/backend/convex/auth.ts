import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";

import { components } from "./_generated/api";
import { type DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

if (!process.env.SITE_URL) {
  throw new Error("SITE_URL environment variable is required");
}
const siteUrl = process.env.SITE_URL;
const nativeAppUrl = process.env.NATIVE_APP_URL || "curb://";

export const authComponent = createClient<DataModel>(components.betterAuth);

function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      expo(),
      passkey(),
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
    ],
    trustedOrigins: [siteUrl, nativeAppUrl],
  });
}

export { createAuth };

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => await authComponent.safeGetAuthUser(ctx),
});
