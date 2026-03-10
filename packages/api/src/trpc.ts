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
}

const t = initTRPC.context<Context>().create();

export const { router } = t;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return await next({ ctx: { ...ctx, user: ctx.user } });
});
