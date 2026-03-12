import { authClient } from "@curb/auth/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { Suspense, useCallback, useState } from "react";
import { toast } from "sonner";

import { ChangeEmail } from "@/components/settings/change-email";
import { ChangePassword } from "@/components/settings/change-password";
import { DangerZone } from "@/components/settings/danger-zone";
import { EmailVerification } from "@/components/settings/email-verification";
import { PasskeysList } from "@/components/settings/passkeys-list";
import { SectionSkeleton } from "@/components/settings/section-skeleton";
import { SessionsList } from "@/components/settings/sessions-list";
import { SessionsSkeleton } from "@/components/settings/sessions-skeleton";
import { TwoFactorSetup } from "@/components/settings/two-factor-setup";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
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

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    navigate({ to: "/login" });
  }, [navigate]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings
          </p>
        </div>

        <div className="space-y-4">
          {/* Appearance */}
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-sm font-medium">Appearance</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Theme</Label>
                <p className="text-xs text-muted-foreground">
                  Select your preferred theme
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                >
                  <Sun className="size-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="size-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="size-4" />
                  System
                </Button>
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-sm font-medium">Account</h2>
            <div className="space-y-4">
              <EmailVerification />
              <Separator />
              <ChangeEmail />
              <Separator />
              <ChangePassword />
            </div>
          </div>

          {/* Security */}
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 text-sm font-medium">Security</h2>
            <div className="space-y-4">
              <TwoFactorSetup />
              <Separator />
              <Suspense fallback={<SectionSkeleton />}>
                <PasskeysList
                  onRegister={handleRegisterPasskey}
                  isRegistering={isRegistering}
                />
              </Suspense>
            </div>
          </div>

          {/* Sessions */}
          <div className="rounded-lg border p-4">
            <Suspense fallback={<SessionsSkeleton />}>
              <SessionsList />
            </Suspense>
          </div>

          {/* Sign out */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Sign out</Label>
                <p className="text-xs text-muted-foreground">
                  Sign out of your account on this device
                </p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <DangerZone />
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});
