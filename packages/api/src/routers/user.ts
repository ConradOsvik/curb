import { user } from "@curb/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

/* oxlint-disable import/no-relative-parent-imports */
import { protectedProcedure, router } from "../trpc";
/* oxlint-enable import/no-relative-parent-imports */

export const userRouter = router({
  deleteAccount: protectedProcedure
    .input(z.object({ confirmName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.confirmName !== ctx.user.name) {
        throw new Error(
          "Confirmation name does not match. Please type your exact display name."
        );
      }

      await ctx.db.delete(user).where(eq(user.id, ctx.user.id));

      return { success: true };
    }),
});
