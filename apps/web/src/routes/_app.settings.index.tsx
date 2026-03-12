import { createFileRoute } from "@tanstack/react-router";

import { ChangeEmail } from "@/components/settings/change-email";
import { ChangeName } from "@/components/settings/change-name";
import { EmailVerification } from "@/components/settings/email-verification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_app/settings/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
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
