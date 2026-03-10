import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface InlineEditProps {
  defaultValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  className?: string;
}

export function InlineEdit({
  defaultValue,
  onSave,
  onCancel,
  className,
}: InlineEditProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  const handleSave = () => {
    if (savedRef.current) {
      return;
    }
    savedRef.current = true;
    const value = inputRef.current?.value.trim();
    if (value && value !== defaultValue) {
      onSave(value);
    } else {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      defaultValue={defaultValue}
      className={cn(
        "rounded border border-blue-500 bg-transparent px-1 font-medium outline-none",
        className
      )}
      onBlur={handleSave}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          handleSave();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          savedRef.current = true;
          onCancel();
        }
      }}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    />
  );
}
