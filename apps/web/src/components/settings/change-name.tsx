import { authClient } from "@curb/auth/client";
import { useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeName({ currentName }: { currentName: string }) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await authClient.updateUser({ name: trimmed });
      if (error) {
        toast.error(error.message || "Failed to update name");
        return;
      }
      toast.success("Name updated");
      void router.invalidate();
    } catch {
      toast.error("Failed to update name");
    } finally {
      setIsSubmitting(false);
    }
  }, [name, currentName, router]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Display name</Label>
        <p className="text-xs text-muted-foreground">
          This is the name shown across your account
        </p>
      </div>
      <ButtonGroup className="w-full">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
        <Button
          onClick={() => void handleSubmit()}
          disabled={!name.trim() || name.trim() === currentName || isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </ButtonGroup>
    </div>
  );
}
