import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { CircleCheck } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  checkout_id: z.string().default(""),
});

export const Route = createFileRoute("/_app/checkout/success")({
  component: CheckoutSuccessPage,
  validateSearch: zodValidator(searchSchema),
});

function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const { checkout_id } = Route.useSearch();

  useEffect(() => {
    if (!checkout_id) {
      navigate({ to: "/dashboard" });
    }
  }, [checkout_id, navigate]);

  if (!checkout_id) {
    return null;
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <CircleCheck className="size-16 text-green-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            You&apos;re all set!
          </h1>
          <p className="text-sm text-muted-foreground">
            Your subscription is now active. Thanks for upgrading!
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/dashboard" })}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
