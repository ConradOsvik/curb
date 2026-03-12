import { authClient } from "@curb/auth/client";
import { BadgeCheck, MailWarning } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function EmailVerification({
  email,
  emailVerified,
}: {
  email: string;
  emailVerified: boolean;
}) {
  const [isSending, setIsSending] = useState(false);

  const handleResend = useCallback(async () => {
    setIsSending(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        callbackURL: "/email-verified",
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

  if (emailVerified) {
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
      <Button
        variant="outline"
        onClick={() => void handleResend()}
        disabled={isSending}
      >
        {isSending ? "Sending..." : "Resend verification"}
      </Button>
    </div>
  );
}
