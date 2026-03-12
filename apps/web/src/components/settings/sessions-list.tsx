import { authClient } from "@curb/auth/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Globe, Laptop, Smartphone } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { listSessions } from "@/lib/session";

function getDeviceIcon(device: string | null | undefined) {
  if (device === "mobile") {
    return Smartphone;
  }
  return Laptop;
}

export function SessionsList({ currentToken }: { currentToken: string }) {
  const { data: sessions, refetch } = useSuspenseQuery({
    queryFn: () => listSessions(),
    queryKey: ["sessions"],
  });

  const handleRevoke = useCallback(
    async (token: string) => {
      try {
        await authClient.revokeSession({ token });
        toast.success("Session revoked");
        refetch();
      } catch {
        toast.error("Failed to revoke session");
      }
    },
    [refetch]
  );

  const handleRevokeAll = useCallback(async () => {
    try {
      await authClient.revokeSessions();
      toast.success("All other sessions revoked");
      refetch();
    } catch {
      toast.error("Failed to revoke sessions");
    }
  }, [refetch]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">Sessions</h2>
        {sessions.length > 1 && (
          <Button variant="outline" onClick={handleRevokeAll}>
            Sign out all other sessions
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {sessions.map((s) => {
          const isCurrentSession = s.token === currentToken;
          const browser = s.browser || "Unknown browser";
          const os = s.os || "Unknown OS";
          const DeviceIcon = getDeviceIcon(s.device);

          return (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-md border px-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                  <DeviceIcon className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {browser} on {os}
                    </p>
                    {isCurrentSession && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="size-3" />
                    <span>{browser}</span>
                    {s.ipAddress && (
                      <>
                        <span className="text-border">|</span>
                        <span>{s.ipAddress}</span>
                      </>
                    )}
                    <span className="text-border">|</span>
                    <span>
                      {new Date(s.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              {!isCurrentSession && (
                <Button variant="outline" onClick={() => handleRevoke(s.token)}>
                  Revoke
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
