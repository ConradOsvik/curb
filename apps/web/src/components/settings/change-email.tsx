import { authClient } from "@curb/auth/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeEmail() {
  const { data: sessionData } = authClient.useSession();
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const currentEmail = sessionData?.user?.email ?? "";

  const handleSubmit = useCallback(async () => {
    if (!newEmail.trim() || newEmail === currentEmail) {
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await authClient.changeEmail({
        newEmail,
      });
      if (error) {
        toast.error(error.message || "Failed to change email");
        return;
      }
      setSent(true);
      toast.success("Verification email sent to your new address");
    } catch {
      toast.error("Failed to change email");
    } finally {
      setIsSubmitting(false);
    }
  }, [newEmail, currentEmail]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Email address</Label>
        <p className="text-xs text-muted-foreground">
          {sent
            ? "Check your new email for a verification link"
            : `Currently ${currentEmail}`}
        </p>
      </div>
      {!sent && (
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="New email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Button
            onClick={handleSubmit}
            disabled={
              !newEmail.trim() || newEmail === currentEmail || isSubmitting
            }
            className="shrink-0"
          >
            {isSubmitting ? "Sending..." : "Change"}
          </Button>
        </div>
      )}
      {sent && (
        <Button
          variant="outline"
          onClick={() => {
            setSent(false);
            setNewEmail("");
          }}
        >
          Change to a different email
        </Button>
      )}
    </div>
  );
}
