import { useForm } from "@tanstack/react-form";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");

  const emailForm = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: value.email,
        type: "forget-password",
      });
      if (error) {
        toast.error(error.message || "Failed to send reset code");
        return;
      }
      setEmail(value.email);
      setStep("reset");
      toast.success("Code sent to your email");
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Invalid email address"),
      }),
    },
  });

  const resetForm = useForm({
    defaultValues: {
      confirmPassword: "",
      otp: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp: value.otp,
        password: value.password,
      });
      if (error) {
        toast.error(error.message || "Failed to reset password");
        return;
      }
      toast.success("Password reset successfully");
      navigate({ to: "/login" });
    },
    validators: {
      onSubmit: z
        .object({
          confirmPassword: z.string(),
          otp: z.string().min(1, "Enter the code from your email"),
          password: z.string().min(8, "Password must be at least 8 characters"),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        }),
    },
  });

  const handleEmailSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      emailForm.handleSubmit();
    },
    [emailForm]
  );

  const handleResetSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resetForm.handleSubmit();
    },
    [resetForm]
  );

  return (
    <div className="relative flex min-h-svh items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:24px_24px] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
      <div className="relative w-full max-w-sm space-y-6 rounded-lg border bg-card p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md bg-foreground text-background">
            <span className="text-sm font-bold">C</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            {step === "email" ? "Forgot your password?" : "Set new password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "email"
              ? "Enter your email and we'll send you a code"
              : `Enter the code sent to ${email}`}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <emailForm.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="you@example.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      key={error?.message}
                      className="text-destructive text-sm"
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </emailForm.Field>

            <emailForm.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send code"}
                </Button>
              )}
            </emailForm.Subscribe>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <resetForm.Field name="otp">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Code</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="000000"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoFocus
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      key={error?.message}
                      className="text-destructive text-sm"
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </resetForm.Field>

            <resetForm.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>New password</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      key={error?.message}
                      className="text-destructive text-sm"
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </resetForm.Field>

            <resetForm.Field name="confirmPassword">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Confirm password</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      key={error?.message}
                      className="text-destructive text-sm"
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </resetForm.Field>

            <resetForm.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "Resetting..." : "Reset password"}
                </Button>
              )}
            </resetForm.Subscribe>
          </form>
        )}

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
