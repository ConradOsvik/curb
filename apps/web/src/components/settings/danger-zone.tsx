import { authClient } from "@curb/auth/client";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DangerZone({ userName }: { userName: string }) {
  const navigate = useNavigate();
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    try {
      await authClient.deleteUser({
        callbackURL: "/login",
      });
      toast.success("Account deleted");
      void navigate({ to: "/login" });
    } catch {
      toast.error("Failed to delete account.");
      setIsDeleting(false);
    }
  }, [navigate]);

  const isDeleteConfirmed = deleteConfirmName === userName;

  return (
    <div className="rounded-lg border border-destructive/30 p-5">
      <h2 className="mb-5 text-sm font-medium text-destructive">Danger Zone</h2>
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <Label>Delete account</Label>
          <p className="text-xs text-muted-foreground">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
        </div>
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              setDeleteConfirmName("");
            }
          }}
        >
          <AlertDialogTrigger
            render={
              <Button variant="destructive" className="shrink-0">
                <Trash2 className="size-4" />
                Delete account
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action is permanent and cannot be undone. All your data
                including receipts, folders, and settings will be permanently
                deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-md bg-destructive/5 p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">
                  To confirm, type your display name{" "}
                  <span className="font-semibold">{userName}</span> below.
                </p>
              </div>
              <Input
                placeholder={userName}
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={!isDeleteConfirmed || isDeleting}
                onClick={() => void handleDeleteAccount()}
              >
                {isDeleting ? "Deleting..." : "Delete my account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
