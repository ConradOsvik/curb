import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import { db } from "@curb/db";
import { sendEmail } from "@curb/email";
import OtpEmail from "@curb/email/templates/otp";
import ResetPasswordEmail from "@curb/email/templates/reset-password";
import VerificationEmail from "@curb/email/templates/verification";
import { env } from "@curb/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, twoFactor } from "better-auth/plugins";

function parseBrowser(ua: string): string {
  if (ua.includes("Firefox")) {
    return "Firefox";
  }
  if (ua.includes("Edg/")) {
    return "Edge";
  }
  if (ua.includes("Chrome")) {
    return "Chrome";
  }
  if (ua.includes("Safari")) {
    return "Safari";
  }
  return "Unknown";
}

function parseOS(ua: string): string {
  if (ua.includes("iPhone") || ua.includes("iPad")) {
    return "iOS";
  }
  if (ua.includes("Android")) {
    return "Android";
  }
  if (ua.includes("Windows")) {
    return "Windows";
  }
  if (ua.includes("Mac OS")) {
    return "macOS";
  }
  if (ua.includes("Linux")) {
    return "Linux";
  }
  return "Unknown";
}

function parseDevice(ua: string): string {
  if (
    ua.includes("iPhone") ||
    ua.includes("Android") ||
    ua.includes("Mobile")
  ) {
    return "mobile";
  }
  if (ua.includes("iPad") || ua.includes("Tablet")) {
    return "tablet";
  }
  return "desktop";
}

export const auth = betterAuth({
  baseURL: env.SITE_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, { provider: "sqlite" }),
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const ua = session.userAgent ?? "";
          return {
            data: {
              ...session,
              browser: parseBrowser(ua),
              device: parseDevice(ua),
              os: parseOS(ua),
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        react: ResetPasswordEmail({ name: user.name, url }),
        subject: "Reset your password",
        to: user.email,
      });
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        react: VerificationEmail({ name: user.name, url }),
        subject: "Verify your email address",
        to: user.email,
      });
    },
  },
  plugins: [
    expo(),
    passkey(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendEmail({
          react: OtpEmail({ otp, type }),
          subject:
            type === "forget-password"
              ? "Reset your password"
              : (type === "sign-in"
                ? "Sign in to Curb"
                : "Verify your email"),
          to: email,
        });
      },
    }),
    twoFactor({
      issuer: "Curb",
      otpOptions: {
        async sendOTP({ user, otp }) {
          await sendEmail({
            react: OtpEmail({ otp, type: "sign-in" }),
            subject: "Your two-factor authentication code",
            to: user.email,
          });
        },
      },
    }),
  ],
  session: {
    additionalFields: {
      browser: { required: false, type: "string" },
      device: { required: false, type: "string" },
      os: { required: false, type: "string" },
    },
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  trustedOrigins: [
    env.SITE_URL ?? "http://localhost:3000",
    env.NATIVE_APP_URL ?? "curb://",
  ],
  user: {
    changeEmail: {
      enabled: true,
    },
  },
});

export type Auth = typeof auth;
