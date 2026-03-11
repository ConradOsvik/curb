import { useSearch } from "@tanstack/react-router";
import { BadgeCheck, MailWarning } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function EmailVerification() {
  const { data: sessionData, refetch } = authClient.useSession();
  const [isSending, setIsSending] = useState(false);
  const search = useSearch({ strict: false }) as Record<string, unknown>;

  // Bypass cookie cache when redirected back from verification link
  useEffect(() => {
    if (search.verified === "true") {
      refetch({ query: { disableCookieCache: true } });
    }
  }, [search.verified, refetch]);

  const isVerified = sessionData?.user?.emailVerified ?? false;
  const email = sessionData?.user?.email ?? "";

  const handleResend = useCallback(async () => {
    setIsSending(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        callbackURL: "/settings?verified=true",
        email,
      });
      if (error) {
        toast.error(error.message || "Failed to send verification email");
        return;
      }
      toast.success("Verification email sent");
    } catch {
      toast.error("Failed to send verification email");
    } finally {
      setIsSending(false);
    }
  }, [email]);

  if (isVerified) {
    return (
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Email verification</Label>
          <p className="text-xs text-muted-foreground">
            Your email is verified
          </p>
        </div>
        <BadgeCheck className="size-5 text-green-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label>Email verification</Label>
          <MailWarning className="size-4 text-amber-500" />
        </div>
        <p className="text-xs text-muted-foreground">
          Your email is not verified
        </p>
      </div>
      <Button variant="outline" onClick={handleResend} disabled={isSending}>
        {isSending ? "Sending..." : "Resend verification"}
      </Button>
    </div>
  );
}
