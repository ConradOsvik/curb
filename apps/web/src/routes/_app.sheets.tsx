import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/sheets")({
  component: SheetsLayout,
});

function SheetsLayout() {
  return <Outlet />;
}
