import type { Database } from "@curb/db";
import { initTRPC, TRPCError } from "@trpc/server";

export interface Context {
  db: Database;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  session: {
    id: string;
    token: string;
    expiresAt: Date;
  } | null;
}

const t = initTRPC.context<Context>().create();

export const { router } = t;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session, user: ctx.user } });
});
