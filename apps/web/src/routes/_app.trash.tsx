import {
  ArrowPathIcon,
  DocumentTextIcon,
  FolderIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_app/trash")({
  component: TrashPage,
});

function TrashPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: trashedFolders = [] } = useQuery(
    trpc.folders.listTrash.queryOptions()
  );
  const { data: trashedReceipts = [] } = useQuery(
    trpc.receipts.listTrash.queryOptions()
  );

  const restoreFolder = useMutation(trpc.folders.restore.mutationOptions());
  const restoreReceipt = useMutation(trpc.receipts.restore.mutationOptions());
  const permanentDeleteFolder = useMutation(
    trpc.folders.permanentDelete.mutationOptions()
  );
  const permanentDeleteReceipt = useMutation(
    trpc.receipts.permanentDelete.mutationOptions()
  );

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [["folders"]] });
    queryClient.invalidateQueries({ queryKey: [["receipts"]] });
  }, [queryClient]);

  const handleRestoreFolder = useCallback(
    async (id: string) => {
      await restoreFolder.mutateAsync({ id });
      invalidateAll();
      toast.success("Folder restored");
    },
    [restoreFolder, invalidateAll]
  );

  const handleRestoreReceipt = useCallback(
    async (id: string) => {
      await restoreReceipt.mutateAsync({ id });
      invalidateAll();
      toast.success("Receipt restored");
    },
    [restoreReceipt, invalidateAll]
  );

  const handlePermanentDeleteFolder = useCallback(
    async (id: string) => {
      await permanentDeleteFolder.mutateAsync({ id });
      invalidateAll();
      toast.success("Folder permanently deleted");
    },
    [permanentDeleteFolder, invalidateAll]
  );

  const handlePermanentDeleteReceipt = useCallback(
    async (id: string) => {
      await permanentDeleteReceipt.mutateAsync({ id });
      invalidateAll();
      toast.success("Receipt permanently deleted");
    },
    [permanentDeleteReceipt, invalidateAll]
  );

  const isEmpty = trashedFolders.length === 0 && trashedReceipts.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h2 className="text-sm font-medium text-muted-foreground">Trash</h2>
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
          <TrashIcon className="size-10" />
          <p className="text-sm">Trash is empty</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto" role="table">
          <div className="sticky top-0 z-10 flex h-8 items-center gap-3 border-b bg-surface px-4 text-xs font-medium text-muted-foreground">
            <div className="size-4 shrink-0" />
            <span className="flex-1">Name</span>
            <span className="w-20 shrink-0">Type</span>
            <span className="w-48 shrink-0 text-right">Actions</span>
          </div>

          {trashedFolders.map((folder) => (
            <TrashRow
              key={folder.id}
              icon={<FolderIcon className="size-4 text-blue-500" />}
              name={folder.name}
              type="Folder"
              onRestore={() => handleRestoreFolder(folder.id)}
              onDelete={() => handlePermanentDeleteFolder(folder.id)}
            />
          ))}

          {trashedReceipts.map((receipt) => (
            <TrashRow
              key={receipt.id}
              icon={
                <DocumentTextIcon className="size-4 text-muted-foreground" />
              }
              name={receipt.merchantName}
              type="Receipt"
              onRestore={() => handleRestoreReceipt(receipt.id)}
              onDelete={() => handlePermanentDeleteReceipt(receipt.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TrashRow({
  icon,
  name,
  type,
  onRestore,
  onDelete,
}: {
  icon: React.ReactNode;
  name: string;
  type: string;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex h-10 items-center gap-3 border-b px-4 text-sm transition-colors hover:bg-accent/30">
      <div className="size-4 shrink-0">{icon}</div>
      <span className="flex-1 truncate font-medium">{name}</span>
      <span className="w-20 shrink-0 text-muted-foreground">{type}</span>
      <div className="flex w-48 shrink-0 items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="sm" onClick={onRestore}>
          <ArrowPathIcon className="mr-1 size-3.5" />
          Restore
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <TrashIcon className="mr-1 size-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}
