import { createFileRoute } from "@tanstack/react-router";
import { Fingerprint, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

interface Passkey {
  id: string;
  name?: string | null;
  createdAt: Date;
}

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);

  const loadPasskeys = useCallback(async () => {
    try {
      const result = await authClient.passkey.listUserPasskeys();
      if (result.data) {
        setPasskeys(result.data);
      }
    } catch {
      // Passkeys may not be supported
    }
  }, []);

  useEffect(() => {
    loadPasskeys();
  }, [loadPasskeys]);

  const handleRegisterPasskey = useCallback(async () => {
    setIsRegistering(true);
    try {
      const result = await authClient.passkey.addPasskey();
      if (result?.error) {
        toast.error(result.error.message || "Failed to register passkey");
      } else {
        toast.success("Passkey registered");
        loadPasskeys();
      }
    } catch {
      toast.error("Failed to register passkey");
    } finally {
      setIsRegistering(false);
    }
  }, [loadPasskeys]);

  const handleDeletePasskey = useCallback(
    async (id: string) => {
      try {
        await authClient.passkey.deletePasskey({ id });
        toast.success("Passkey deleted");
        loadPasskeys();
      } catch {
        toast.error("Failed to delete passkey");
      }
    },
    [loadPasskeys]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <div className="space-y-4">
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
                size="sm"
                onClick={() => setTheme("light")}
              >
                <Sun className="mr-1.5 size-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                <Moon className="mr-1.5 size-4" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
              >
                <Monitor className="mr-1.5 size-4" />
                System
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-sm font-medium">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Passkeys</Label>
                <p className="text-xs text-muted-foreground">
                  Use biometrics or a security key to sign in
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRegisterPasskey}
                disabled={isRegistering}
              >
                <Fingerprint className="mr-1.5 size-4" />
                {isRegistering ? "Registering..." : "Register Passkey"}
              </Button>
            </div>

            {passkeys.length > 0 && (
              <div className="space-y-2">
                {passkeys.map((pk) => (
                  <div
                    key={pk.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Fingerprint className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {pk.name || "Passkey"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Added{" "}
                          {new Date(pk.createdAt).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePasskey(pk.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
