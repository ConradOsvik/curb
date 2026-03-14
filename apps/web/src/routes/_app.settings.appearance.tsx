import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/solid";
import { createFileRoute } from "@tanstack/react-router";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/settings/appearance")({
  component: AppearancePage,
});

function AppearancePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
        <p className="text-sm text-muted-foreground">
          Customize how the app looks
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium">Theme</h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Theme preference</Label>
            <p className="text-xs text-muted-foreground">
              Select your preferred theme
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
            >
              <SunIcon className="size-4" />
              Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
            >
              <MoonIcon className="size-4" />
              Dark
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              onClick={() => setTheme("system")}
            >
              <ComputerDesktopIcon className="size-4" />
              System
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
