import { env } from "@curb/env/server";
import { Polar } from "@polar-sh/sdk";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

const polar = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});

export const billingRouter = router({
  getCheckout: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const checkout = await polar.checkouts.get({ id: input.id });
      return {
        id: checkout.id,
        productDescription: checkout.product?.description ?? null,
        productName: checkout.product?.name ?? "Your plan",
        status: checkout.status,
      };
    }),
});
