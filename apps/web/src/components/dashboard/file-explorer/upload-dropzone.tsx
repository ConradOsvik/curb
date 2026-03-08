import { useConvexAction, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@curb/backend/convex/_generated/api";
import type { Id } from "@curb/backend/convex/_generated/dataModel";
import { Upload } from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import { toast } from "sonner";

interface UploadDropzoneProps {
  children: ReactNode;
  currentFolderId?: Id<"folders">;
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

  const generateUploadUrl = useConvexMutation(
    api.storage.mutations.generateUploadUrl
  );
  const scanReceipt = useConvexAction(api.receipts.actions.scan);

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
          const uploadUrl = await generateUploadUrl();

          const response = await fetch(uploadUrl, {
            body: file,
            headers: { "Content-Type": file.type },
            method: "POST",
          });

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          const { storageId } = (await response.json()) as {
            storageId: Id<"_storage">;
          };

          await scanReceipt({
            folderId: currentFolderId,
            storageId,
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
    [currentFolderId, generateUploadUrl, scanReceipt, onUploadComplete]
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
          <Upload className="size-12 text-primary" />
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
