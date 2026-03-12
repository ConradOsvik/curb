import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto max-w-2xl p-6">
        <Outlet />
      </div>
    </div>
  );
}
