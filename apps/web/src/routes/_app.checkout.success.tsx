import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useEffect } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc";

const searchSchema = z.object({
  checkout_id: z.string().default(""),
});

export const Route = createFileRoute("/_app/checkout/success")({
  component: CheckoutSuccessPage,
  validateSearch: zodValidator(searchSchema),
});

function CheckoutSuccessPage() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { checkout_id } = Route.useSearch();

  const { data: checkout, isLoading } = useQuery(
    trpc.billing.getCheckout.queryOptions(
      { id: checkout_id },
      { enabled: !!checkout_id }
    )
  );

  useEffect(() => {
    if (!checkout_id) {
      void navigate({ to: "/dashboard" });
    }
  }, [checkout_id, navigate]);

  if (!checkout_id) {
    return null;
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircleIcon className="size-16 text-green-500" />
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="mx-auto h-8 w-48" />
            <Skeleton className="mx-auto h-4 w-64" />
          </div>
        ) : (
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome to {checkout?.productName ?? "your new plan"}!
            </h1>
            <p className="text-sm text-muted-foreground">
              {checkout?.productDescription ??
                "Your subscription is now active. Thanks for upgrading!"}
            </p>
          </div>
        )}
        <Button onClick={() => void navigate({ to: "/dashboard" })}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
