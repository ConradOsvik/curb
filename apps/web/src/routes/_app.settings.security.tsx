import { authClient } from "@curb/auth/client";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useState } from "react";
import { toast } from "sonner";

import { ChangePassword } from "@/components/settings/change-password";
import { PasskeysList } from "@/components/settings/passkeys-list";
import { SectionSkeleton } from "@/components/settings/section-skeleton";
import { SessionsList } from "@/components/settings/sessions-list";
import { SessionsSkeleton } from "@/components/settings/sessions-skeleton";
import { TwoFactorSetup } from "@/components/settings/two-factor-setup";
import { Separator } from "@/components/ui/separator";
import { listPasskeys, listSessions } from "@/lib/session";

export const Route = createFileRoute("/_app/settings/security")({
  component: SecurityPage,
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery({
      queryFn: () => listSessions(),
      queryKey: ["sessions"],
    });
    void context.queryClient.prefetchQuery({
      queryFn: () => listPasskeys(),
      queryKey: ["passkeys"],
    });
  },
});

function SecurityPage() {
  const { user, session } = Route.useRouteContext();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegisterPasskey = useCallback(async () => {
    setIsRegistering(true);
    try {
      const result = await authClient.passkey.addPasskey();
      if (result?.error) {
        toast.error(result.error.message || "Failed to register passkey");
      } else {
        toast.success("Passkey registered");
      }
    } catch {
      toast.error("Failed to register passkey");
    } finally {
      setIsRegistering(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="text-sm text-muted-foreground">
          Protect your account with security features
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium">Password</h2>
        <ChangePassword />
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium">Two-Factor Authentication</h2>
        <div className="space-y-4">
          <TwoFactorSetup twoFactorEnabled={user.twoFactorEnabled ?? false} />
          <Separator />
          <Suspense fallback={<SectionSkeleton />}>
            <PasskeysList
              onRegister={() => void handleRegisterPasskey()}
              isRegistering={isRegistering}
            />
          </Suspense>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <Suspense fallback={<SessionsSkeleton />}>
          <SessionsList currentToken={session.token} />
        </Suspense>
      </div>
    </div>
  );
}
