import { storage } from "@curb/storage";
import { nanoid } from "nanoid";
import { z } from "zod";

// oxlint-disable-next-line import/no-relative-parent-imports
import { protectedProcedure, router } from "../trpc";

export const storageRouter = router({
  getImageUrl: protectedProcedure
    .input(z.object({ storageKey: z.string() }))
    .query(({ input }) => storage.getPublicUrl(input.storageKey)),

  getUploadUrl: protectedProcedure
    .input(z.object({ contentType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const key = `${ctx.user.id}/${nanoid()}`;
      const url = await storage.getUploadUrl(key, input.contentType);
      return { key, url };
    }),
});
