import type { ReceiptWithItems } from "@curb/api";
import { TrashIcon } from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { TrashContextMenu } from "@/components/dashboard/context-menus/trash-context-menu";
import {
  FileExplorer,
  type ItemWrapperProps,
} from "@/components/dashboard/file-explorer/file-explorer";
import { type ExplorerItem, sortItems } from "@/hooks/use-dashboard";
import { useTRPC } from "@/lib/trpc";

const searchSchema = z.object({
  folder: z.string().optional(),
});

export const Route = createFileRoute("/_app/trash")({
  component: TrashPage,
  validateSearch: zodValidator(searchSchema),
});

function TrashPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const search = useSearch({ from: "/_app/trash" });

  const currentFolderId = search.folder;

  const setCurrentFolderId = useCallback(
    (folderId?: string) => {
      navigate({ search: { folder: folderId }, to: "/trash" });
    },
    [navigate]
  );

  const { data: trashedFolders = [] } = useQuery(
    trpc.folders.listTrash.queryOptions({ parentId: currentFolderId })
  );
  const { data: trashedReceipts = [] } = useQuery(
    trpc.receipts.listTrash.queryOptions({ folderId: currentFolderId })
  );
  const { data: path = [] } = useQuery(
    trpc.folders.getPath.queryOptions({ folderId: currentFolderId })
  );

  const items: ExplorerItem[] = useMemo(
    () =>
      sortItems([
        ...trashedFolders.map((f) => ({ item: f, type: "folder" as const })),
        ...trashedReceipts.map((r) => ({ item: r, type: "receipt" as const })),
      ]),
    [trashedFolders, trashedReceipts]
  );

  const parentFolderId = useMemo(
    () => (path.length >= 2 ? path.at(-2)?.id : undefined),
    [path]
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

  const handleRestore = useCallback(
    async (id: string, type: "folder" | "receipt") => {
      if (type === "folder") {
        await restoreFolder.mutateAsync({ id });
        toast.success("Folder restored");
      } else {
        await restoreReceipt.mutateAsync({ id });
        toast.success("Receipt restored");
      }
      invalidateAll();
    },
    [restoreFolder, restoreReceipt, invalidateAll]
  );

  const handlePermanentDelete = useCallback(
    async (id: string, type: "folder" | "receipt") => {
      if (type === "folder") {
        await permanentDeleteFolder.mutateAsync({ id });
        toast.success("Folder permanently deleted");
      } else {
        await permanentDeleteReceipt.mutateAsync({ id });
        toast.success("Receipt permanently deleted");
      }
      invalidateAll();
    },
    [permanentDeleteFolder, permanentDeleteReceipt, invalidateAll]
  );

  const handleDeleteItems = useCallback(
    (ids: Set<string>) => {
      for (const id of ids) {
        const item = items.find((entry) => entry.item.id === id);
        if (item) {
          handlePermanentDelete(id, item.type);
        }
      }
    },
    [items, handlePermanentDelete]
  );

  const renderItemWrapper = useCallback(
    ({ entry, children }: ItemWrapperProps) => (
      <TrashContextMenu
        onRestore={() => handleRestore(entry.item.id, entry.type)}
        onPermanentDelete={() =>
          handlePermanentDelete(entry.item.id, entry.type)
        }
      >
        {children}
      </TrashContextMenu>
    ),
    [handleRestore, handlePermanentDelete]
  );

  const handleViewReceipt = useCallback((_receipt: ReceiptWithItems) => {
    // Could open a detail panel in the future
  }, []);

  return (
    <FileExplorer
      items={items}
      path={path}
      currentFolderId={currentFolderId}
      parentFolderId={parentFolderId}
      onNavigate={setCurrentFolderId}
      onViewReceipt={handleViewReceipt}
      renderItemWrapper={renderItemWrapper}
      rootIcon={<TrashIcon className="size-4" />}
      rootLabel="Trash"
      onDeleteItems={handleDeleteItems}
      enableRubberBand
      emptyIcon={<TrashIcon className="size-10" />}
      emptyMessage="Trash is empty"
    />
  );
}
