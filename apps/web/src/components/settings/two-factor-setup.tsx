import { authClient } from "@curb/auth/client";
import { ShieldCheck, ShieldOff } from "lucide-react";
import QRCodeStyling from "qr-code-styling";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "idle" | "setup" | "verify" | "backup-codes";

function TotpQRCode({ data }: { data: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const qr = new QRCodeStyling({
      cornersDotOptions: {
        color: "#000000",
        type: "dot",
      },
      cornersSquareOptions: {
        color: "#000000",
        type: "extra-rounded",
      },
      data,
      dotsOptions: {
        color: "#000000",
        type: "rounded",
      },
      height: 200,
      qrOptions: {
        errorCorrectionLevel: "H",
      },
      type: "svg",
      width: 200,
    });

    const container = ref.current;
    if (container) {
      container.innerHTML = "";
      qr.append(container);
    }
  }, [data]);

  return <div ref={ref} />;
}

function getButtonLabel(twoFactorEnabled: boolean): string {
  return twoFactorEnabled ? "Disable 2FA" : "Continue";
}

export function TwoFactorSetup({
  twoFactorEnabled: initialEnabled,
}: {
  twoFactorEnabled: boolean;
}) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<Step>("idle");
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEnable = useCallback(async () => {
    if (!password) {
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
      });
      if (error) {
        toast.error(error.message || "Failed to enable 2FA");
        return;
      }
      setTotpURI(data.totpURI);
      setBackupCodes(data.backupCodes);
      setStep("verify");
      setPassword("");
    } catch {
      toast.error("Failed to enable 2FA");
    } finally {
      setIsSubmitting(false);
    }
  }, [password]);

  const handleVerify = useCallback(async () => {
    if (!verifyCode) {
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: verifyCode,
      });
      if (error) {
        toast.error(error.message || "Invalid code");
        return;
      }
      toast.success("Two-factor authentication enabled");
      setTwoFactorEnabled(true);
      setStep("backup-codes");
      setVerifyCode("");
    } catch {
      toast.error("Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [verifyCode]);

  const handleDisable = useCallback(async () => {
    if (!password) {
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await authClient.twoFactor.disable({
        password,
      });
      if (error) {
        toast.error(error.message || "Failed to disable 2FA");
        return;
      }
      toast.success("Two-factor authentication disabled");
      setTwoFactorEnabled(false);
      setStep("idle");
      setPassword("");
    } catch {
      toast.error("Failed to disable 2FA");
    } finally {
      setIsSubmitting(false);
    }
  }, [password]);

  // Show backup codes after successful setup
  if (step === "backup-codes") {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>Backup codes</Label>
          <p className="text-xs text-muted-foreground">
            Save these codes in a safe place. Each code can only be used once.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/50 p-3">
          {backupCodes.map((code) => (
            <code key={code} className="text-center text-sm font-mono">
              {code}
            </code>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            void navigator.clipboard.writeText(backupCodes.join("\n"));
            toast.success("Backup codes copied to clipboard");
          }}
        >
          Copy codes
        </Button>
        <Button onClick={() => setStep("idle")}>Done</Button>
      </div>
    );
  }

  // Verify TOTP code step
  if (step === "verify") {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>Set up authenticator</Label>
          <p className="text-xs text-muted-foreground">
            Scan this QR code with your authenticator app, then enter the code
            to verify.
          </p>
        </div>
        <div className="flex justify-center rounded-md border bg-white p-4">
          <TotpQRCode data={totpURI} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="totp-verify">Verification code</Label>
          <Input
            id="totp-verify"
            placeholder="000000"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleVerify();
              }
            }}
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setStep("idle");
              setTotpURI("");
              setVerifyCode("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleVerify()}
            disabled={!verifyCode || isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify and enable"}
          </Button>
        </div>
      </div>
    );
  }

  // Enable/disable step (password required)
  if (step === "setup") {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>
            {twoFactorEnabled ? "Disable" : "Enable"} two-factor authentication
          </Label>
          <p className="text-xs text-muted-foreground">
            Enter your password to continue
          </p>
        </div>
        <Input
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (twoFactorEnabled) {
                void handleDisable();
              } else {
                void handleEnable();
              }
            }
          }}
          autoFocus
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep("idle")}>
            Cancel
          </Button>
          <Button
            variant={twoFactorEnabled ? "destructive" : "default"}
            onClick={() =>
              void (twoFactorEnabled ? handleDisable() : handleEnable())
            }
            disabled={!password || isSubmitting}
          >
            {isSubmitting ? "Processing..." : getButtonLabel(twoFactorEnabled)}
          </Button>
        </div>
      </div>
    );
  }

  // Idle state
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Label>Two-factor authentication</Label>
        <p className="text-xs text-muted-foreground">
          {twoFactorEnabled
            ? "Your account is protected with 2FA"
            : "Add an extra layer of security to your account"}
        </p>
      </div>
      <Button
        variant={twoFactorEnabled ? "outline" : "default"}
        onClick={() => setStep("setup")}
      >
        {twoFactorEnabled ? (
          <>
            <ShieldOff className="size-4" />
            Disable
          </>
        ) : (
          <>
            <ShieldCheck className="size-4" />
            Enable
          </>
        )}
      </Button>
    </div>
  );
}
