import { authClient } from "@curb/auth/client";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/solid";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { DangerZone } from "@/components/settings/danger-zone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/settings/danger-zone")({
  component: DangerZonePage,
});

function DangerZonePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    void navigate({ to: "/login" });
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Danger Zone</h1>
        <p className="text-sm text-muted-foreground">
          Irreversible account actions
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Sign out</Label>
            <p className="text-xs text-muted-foreground">
              Sign out of your account on this device
            </p>
          </div>
          <Button variant="outline" onClick={() => void handleSignOut()}>
            <ArrowRightStartOnRectangleIcon className="size-4" />
            Sign out
          </Button>
        </div>
      </div>

      <DangerZone userName={user.name} />
    </div>
  );
}
