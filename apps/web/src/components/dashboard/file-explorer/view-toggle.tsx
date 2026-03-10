import { ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/solid";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-md border">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 rounded-none rounded-l-md px-2.5",
          view === "list" && "bg-accent"
        )}
        onClick={() => onViewChange("list")}
        aria-label="List view"
      >
        <ListBulletIcon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 rounded-none rounded-r-md px-2.5",
          view === "grid" && "bg-accent"
        )}
        onClick={() => onViewChange("grid")}
        aria-label="Grid view"
      >
        <Squares2X2Icon className="size-4" />
      </Button>
    </div>
  );
}
