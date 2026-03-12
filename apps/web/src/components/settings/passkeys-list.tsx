import { authClient } from "@curb/auth/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Fingerprint, Trash2 } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Passkey {
  id: string;
  name?: string | null;
  createdAt: Date;
}

export function PasskeysList({
  onRegister,
  isRegistering,
}: {
  onRegister: () => void;
  isRegistering: boolean;
}) {
  const { data: passkeys, refetch } = useSuspenseQuery({
    queryFn: async () => {
      const result = await authClient.passkey.listUserPasskeys();
      return (result.data ?? []) as Passkey[];
    },
    queryKey: ["passkeys"],
  });

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await authClient.passkey.deletePasskey({ id });
        toast.success("Passkey deleted");
        refetch();
      } catch {
        toast.error("Failed to delete passkey");
      }
    },
    [refetch]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Passkeys</Label>
          <p className="text-xs text-muted-foreground">
            Use biometrics or a security key to sign in
          </p>
        </div>
        <Button variant="outline" onClick={onRegister} disabled={isRegistering}>
          <Fingerprint className="size-4" />
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
                  <p className="text-sm font-medium">{pk.name || "Passkey"}</p>
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
                size="icon"
                onClick={() => handleDelete(pk.id)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
