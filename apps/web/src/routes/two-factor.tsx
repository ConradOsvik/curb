import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/two-factor")({
  component: TwoFactorPage,
});

type Method = "totp" | "otp" | "backup";

function TwoFactorPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("totp");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleVerify = useCallback(async () => {
    if (!code.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      if (method === "totp") {
        const { error } = await authClient.twoFactor.verifyTotp({
          code,
          trustDevice: true,
        });
        if (error) {
          toast.error(error.message || "Invalid code");
          return;
        }
      } else if (method === "otp") {
        const { error } = await authClient.twoFactor.verifyOtp({
          code,
          trustDevice: true,
        });
        if (error) {
          toast.error(error.message || "Invalid code");
          return;
        }
      } else {
        const { error } = await authClient.twoFactor.verifyBackupCode({
          code,
          trustDevice: true,
        });
        if (error) {
          toast.error(error.message || "Invalid backup code");
          return;
        }
      }
      toast.success("Verified successfully");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [code, method, navigate]);

  const handleSendOtp = useCallback(async () => {
    try {
      await authClient.twoFactor.sendOtp();
      setOtpSent(true);
      toast.success("Code sent to your email");
    } catch {
      toast.error("Failed to send code");
    }
  }, []);

  return (
    <div className="relative flex min-h-svh items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:24px_24px] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
      <div className="relative w-full max-w-sm space-y-6 rounded-lg border bg-card p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md bg-foreground text-background">
            <ShieldCheck className="size-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Two-factor authentication
          </h1>
          <p className="text-sm text-muted-foreground">
            {method === "totp"
              ? "Enter the code from your authenticator app"
              : (method === "otp"
                ? "Enter the code sent to your email"
                : "Enter one of your backup codes")}
          </p>
        </div>

        <div className="space-y-4">
          {method === "otp" && !otpSent ? (
            <Button className="w-full" onClick={handleSendOtp}>
              <Mail className="size-4" />
              Send code to email
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">
                  {method === "backup" ? "Backup code" : "Verification code"}
                </Label>
                <Input
                  id="code"
                  placeholder={method === "backup" ? "xxxxxxxx" : "000000"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleVerify();
                    }
                  }}
                  autoFocus
                />
              </div>
              <Button
                className="w-full"
                disabled={!code.trim() || isSubmitting}
                onClick={handleVerify}
              >
                {isSubmitting ? "Verifying..." : "Verify"}
              </Button>
            </>
          )}
        </div>

        <div className="space-y-2">
          {method !== "totp" && (
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMethod("totp");
                setCode("");
              }}
            >
              <ShieldCheck className="size-4" />
              Use authenticator app
            </button>
          )}
          {method !== "otp" && (
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMethod("otp");
                setCode("");
                setOtpSent(false);
              }}
            >
              <Mail className="size-4" />
              Send code via email
            </button>
          )}
          {method !== "backup" && (
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMethod("backup");
                setCode("");
              }}
            >
              <KeyRound className="size-4" />
              Use a backup code
            </button>
          )}
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate({ to: "/login" })}
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </button>
      </div>
    </div>
  );
}
