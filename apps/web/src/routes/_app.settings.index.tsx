import { createFileRoute } from "@tanstack/react-router";

import { ChangeAvatar } from "@/components/settings/change-avatar";
import { ChangeEmail } from "@/components/settings/change-email";
import { ChangeName } from "@/components/settings/change-name";
import { EmailVerification } from "@/components/settings/email-verification";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_app/settings/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile information
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium">Avatar</h2>
        <ChangeAvatar currentImage={user.image} name={user.name} />
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium">Display Name</h2>
        <ChangeName currentName={user.name} />
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium">Email</h2>
        <div className="space-y-4">
          <EmailVerification
            email={user.email}
            emailVerified={user.emailVerified}
          />
          <Separator />
          <ChangeEmail currentEmail={user.email} />
        </div>
      </div>
    </div>
  );
}
