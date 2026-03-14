import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/email-verified")({
  component: EmailVerifiedPage,
});

function EmailVerifiedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <CheckBadgeIcon className="size-16 text-green-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Email verified
          </h1>
          <p className="text-sm text-muted-foreground">
            Your email address has been successfully verified. You now have full
            access to all features.
          </p>
        </div>
        <Button onClick={() => void navigate({ to: "/dashboard" })}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
