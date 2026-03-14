import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  SwatchIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const navItems = [
  { icon: DocumentTextIcon, label: "Files", to: "/dashboard" },
  { icon: TrashIcon, label: "Trash", to: "/trash" },
  { icon: UserIcon, label: "Profile", to: "/settings" },
  { icon: SwatchIcon, label: "Appearance", to: "/settings/appearance" },
  { icon: LockClosedIcon, label: "Security", to: "/settings/security" },
  {
    icon: ExclamationTriangleIcon,
    label: "Danger Zone",
    to: "/settings/danger-zone",
  },
];

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const navigate = useNavigate();

  const handleSelect = useCallback(
    (to: string) => {
      onOpenChange(false);
      void navigate({ to });
    },
    [navigate, onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navItems.map((item) => (
              <CommandItem key={item.to} onSelect={() => handleSelect(item.to)}>
                <item.icon className="size-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
