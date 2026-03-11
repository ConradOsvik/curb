import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";
import { type ReactNode, useCallback, useRef, useState } from "react";

interface UploadDropzoneProps {
  children: ReactNode;
  onFiles: (files: File[]) => void;
  className?: string;
}

export function UploadDropzone({
  children,
  onFiles,
  className,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragOver(false);

      const files = [...e.dataTransfer.files].filter((file) =>
        file.type.startsWith("image/")
      );
      if (files.length > 0) {
        onFiles(files);
      }
    },
    [onFiles]
  );

  return (
    <div
      className={className ? `relative ${className}` : "relative"}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {isDragOver && (
        <div className="absolute inset-0 z-50 p-2">
          <div className="flex size-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-blue-500 bg-blue-500/10">
            <ArrowUpTrayIcon className="size-10 text-blue-500" />
            <p className="text-sm font-medium text-blue-500">
              Drop receipt images to scan
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
