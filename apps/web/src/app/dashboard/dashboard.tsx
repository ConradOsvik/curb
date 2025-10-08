"use client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export default function Dashboard({
  customerState,
}: {
  customerState: ReturnType<typeof authClient.customer.state>;
  session: typeof authClient.$Infer.Session;
}) {
  const privateData = useQuery(trpc.privateData.queryOptions());

  const hasProSubscription =
    Array.isArray(customerState?.activeSubscriptions) &&
    customerState.activeSubscriptions.length > 0;

  // eslint-disable-next-line no-console
  console.log("Active subscriptions:", customerState?.activeSubscriptions);

  return (
    <>
      <p>API: {privateData.data?.message}</p>
      <p>Plan: {hasProSubscription ? "Pro" : "Free"}</p>
      {hasProSubscription ? (
        <Button onClick={async () => await authClient.customer.portal()}>
          Manage Subscription
        </Button>
      ) : (
        <Button
          onClick={async () => await authClient.checkout({ slug: "pro" })}
        >
          Upgrade to Pro
        </Button>
      )}
    </>
  );
}
