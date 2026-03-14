import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export default function ErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex h-full items-center justify-center pt-8">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <ExclamationTriangleIcon className="size-10 text-destructive" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred"}
          </p>
        </div>
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
