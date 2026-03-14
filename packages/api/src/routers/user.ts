import { user as userTable } from "@curb/db/schema";
import { AVATAR_COLORS, generateAvatarSvg } from "@curb/storage";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

/* oxlint-disable import/no-relative-parent-imports */
import { protectedProcedure, router } from "../trpc";
/* oxlint-enable import/no-relative-parent-imports */

export const userRouter = router({
  confirmProfileImage: protectedProcedure
    .input(z.object({ storageKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!input.storageKey.startsWith("avatars/")) {
        throw new Error("Invalid storage key");
      }

      await ctx.storage.confirmObject(input.storageKey);

      const newUrl = ctx.storage.getPublicUrl(input.storageKey);
      if (!newUrl) {
        throw new Error("S3_PUBLIC_URL is required");
      }

      // Clean up old avatar if it's a different S3 object
      if (ctx.user.image) {
        const oldKey = ctx.storage.getKeyFromUrl(ctx.user.image);
        if (oldKey && oldKey !== input.storageKey) {
          await ctx.storage.deleteObject(oldKey);
        }
      }

      await ctx.db
        .update(userTable)
        .set({ image: newUrl })
        .where(eq(userTable.id, ctx.user.id));

      return { imageUrl: newUrl };
    }),

  getProfileImageUploadUrl: protectedProcedure
    .input(z.object({ contentType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const key = `avatars/${nanoid()}`;
      const url = await ctx.storage.getUploadUrl(key, input.contentType);
      return { key, url };
    }),

  regenerateAvatar: protectedProcedure.mutation(async ({ ctx }) => {
    const color =
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] ??
      "607d8b";
    const svg = generateAvatarSvg(ctx.user.name, color);
    const key = `avatars/${nanoid()}.svg`;

    await ctx.storage.putObject(key, svg, "image/svg+xml");

    const imageUrl = ctx.storage.getPublicUrl(key);
    if (!imageUrl) {
      throw new Error("S3_PUBLIC_URL is required");
    }

    // Clean up old avatar
    if (ctx.user.image) {
      const oldKey = ctx.storage.getKeyFromUrl(ctx.user.image);
      if (oldKey && oldKey !== key) {
        await ctx.storage.deleteObject(oldKey);
      }
    }

    await ctx.db
      .update(userTable)
      .set({ image: imageUrl })
      .where(eq(userTable.id, ctx.user.id));

    return { imageUrl };
  }),
});
