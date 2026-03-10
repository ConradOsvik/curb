import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";
import { useMutation } from "@tanstack/react-query";
import { type ReactNode, useCallback, useState } from "react";
import { toast } from "sonner";

import { useTRPC } from "@/lib/trpc";

interface UploadDropzoneProps {
  children: ReactNode;
  currentFolderId?: string;
  onUploadComplete?: () => void;
  className?: string;
}

export function UploadDropzone({
  children,
  currentFolderId,
  onUploadComplete,
  className,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const trpc = useTRPC();
  const uploadUrl = useMutation(trpc.storage.getUploadUrl.mutationOptions());
  const scanReceipt = useMutation(trpc.receipts.scan.mutationOptions());

  const handleUpload = useCallback(
    async (files: FileList) => {
      const imageFiles = [...files].filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length === 0) {
        toast.error("Please upload image files only");
        return;
      }

      setIsUploading(true);
      const toastId = toast.loading(
        `Scanning ${imageFiles.length} receipt${imageFiles.length > 1 ? "s" : ""}...`
      );

      try {
        for (const file of imageFiles) {
          const { url, key } = await uploadUrl.mutateAsync({
            contentType: file.type,
          });

          const response = await fetch(url, {
            body: file,
            headers: { "Content-Type": file.type },
            method: "PUT",
          });

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          await scanReceipt.mutateAsync({
            folderId: currentFolderId,
            storageKey: key,
          });
        }

        toast.success(
          `Successfully scanned ${imageFiles.length} receipt${imageFiles.length > 1 ? "s" : ""}`,
          { id: toastId }
        );
        onUploadComplete?.();
      } catch {
        toast.error("Failed to scan receipt", { id: toastId });
      } finally {
        setIsUploading(false);
      }
    },
    [currentFolderId, uploadUrl, scanReceipt, onUploadComplete]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const { files } = e.dataTransfer;
      if (files.length > 0) {
        handleUpload(files);
      }
    },
    [handleUpload]
  );

  return (
    <div
      className={className ? `relative ${className}` : "relative"}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {isDragOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
          <ArrowUpTrayIcon className="size-12 text-primary" />
          <p className="text-lg font-medium text-primary">
            Drop receipt images to scan
          </p>
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-lg bg-background/80 backdrop-blur-sm">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Scanning receipts...
          </p>
        </div>
      )}
    </div>
  );
}
