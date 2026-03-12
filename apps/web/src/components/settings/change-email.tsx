import { authClient } from "@curb/auth/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeEmail({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

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
        <ButtonGroup className="w-full">
          <Input
            type="email"
            placeholder="New email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Button
            onClick={() => void handleSubmit()}
            disabled={
              !newEmail.trim() || newEmail === currentEmail || isSubmitting
            }
          >
            {isSubmitting ? "Sending..." : "Change"}
          </Button>
        </ButtonGroup>
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
