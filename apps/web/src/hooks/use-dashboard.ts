import {
  convexQuery,
  useConvexAction,
  useConvexMutation,
} from "@convex-dev/react-query";
import { api } from "@curb/backend/convex/_generated/api";
import type { Doc, Id } from "@curb/backend/convex/_generated/dataModel";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type FolderColor =
  | "blue"
  | "gray"
  | "green"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "yellow";

export type ExplorerItem =
  | { type: "folder"; item: Doc<"folders"> }
  | { type: "receipt"; item: Doc<"receipts"> };

function getItemOrder(item: ExplorerItem): number {
  return item.item.order ?? item.item._creationTime;
}

export function sortItems(items: ExplorerItem[]): ExplorerItem[] {
  return [...items].toSorted(
    (a: ExplorerItem, b: ExplorerItem) => getItemOrder(a) - getItemOrder(b)
  );
}

export function useDashboardState() {
  const search = useSearch({ from: "/_app/dashboard" }) as {
    folder?: string;
  };
  const navigate = useNavigate();
  const currentFolderId = search.folder as Id<"folders"> | undefined;

  const setCurrentFolderId = useCallback(
    (folderId?: Id<"folders">) => {
      navigate({
        search: { folder: folderId },
        to: "/dashboard",
      });
    },
    [navigate]
  );

  const [viewingReceipt, setViewingReceipt] = useState<Doc<"receipts"> | null>(
    null
  );

  return {
    currentFolderId,
    setCurrentFolderId,
    setViewingReceipt,
    viewingReceipt,
  };
}

export function useDashboardQueries(
  currentFolderId: Id<"folders"> | undefined
) {
  const { data: folders = [] } = useQuery(
    convexQuery(api.folders.queries.listByParent, { parentId: currentFolderId })
  );

  const { data: allFolders = [] } = useQuery(
    convexQuery(api.folders.queries.listAll, {})
  );

  const { data: path = [] } = useQuery(
    convexQuery(api.folders.queries.getPath, { folderId: currentFolderId })
  );

  const { data: receipts = [] } = useQuery(
    convexQuery(api.receipts.queries.listWithFilters, {
      folderId: currentFolderId,
    })
  );

  const items = sortItems([
    ...folders.map((f) => ({ item: f, type: "folder" as const })),
    ...receipts.map((r) => ({ item: r, type: "receipt" as const })),
  ]);

  return { allFolders, folders, items, path, receipts };
}

export function useDashboardMutations() {
  return {
    createFolder: useConvexMutation(api.folders.mutations.create),
    deleteReceipt: useConvexMutation(api.receipts.mutations.deleteReceipt),
    generateUploadUrl: useConvexMutation(
      api.storage.mutations.generateUploadUrl
    ),
    moveFolder: useConvexMutation(api.folders.mutations.move),
    moveReceipt: useConvexMutation(api.receipts.mutations.moveToFolder),
    removeFolder: useConvexMutation(api.folders.mutations.remove),
    reorderFolders: useConvexMutation(api.folders.mutations.reorder),
    reorderReceipts: useConvexMutation(api.receipts.mutations.reorder),
    scanReceipt: useConvexAction(api.receipts.actions.scan),
    updateFolder: useConvexMutation(api.folders.mutations.update),
  };
}

function useFolderQueryKey(folderId: Id<"folders"> | undefined) {
  return convexQuery(api.folders.queries.listByParent, {
    parentId: folderId,
  }).queryKey;
}

function useReceiptQueryKey(folderId: Id<"folders"> | undefined) {
  return convexQuery(api.receipts.queries.listWithFilters, {
    folderId,
  }).queryKey;
}

export function useFolderActions(
  mutations: ReturnType<typeof useDashboardMutations>,
  state: ReturnType<typeof useDashboardState>
) {
  const queryClient = useQueryClient();
  const folderKey = useFolderQueryKey(state.currentFolderId);
  const receiptKey = useReceiptQueryKey(state.currentFolderId);

  const handleCreateFolder = useCallback(
    async (name: string) => {
      if (!name.trim()) {
        return;
      }

      const tempId = `temp_${Date.now()}` as Id<"folders">;
      const now = Date.now();
      const optimisticFolder: Doc<"folders"> = {
        _creationTime: now,
        _id: tempId,
        color: undefined,
        createdAt: now,
        name: name.trim(),
        order: now,
        parentId: state.currentFolderId,
        userId: "",
      };

      queryClient.setQueryData(
        folderKey,
        (old: Doc<"folders">[] | undefined) => [
          ...(old ?? []),
          optimisticFolder,
        ]
      );

      try {
        await mutations.createFolder({
          name: name.trim(),
          parentId: state.currentFolderId,
        });
        toast.success("Folder created");
      } catch {
        queryClient.invalidateQueries({ queryKey: folderKey });
        toast.error("Failed to create folder");
      }
    },
    [mutations, state.currentFolderId, queryClient, folderKey]
  );

  const handleRenameFolder = useCallback(
    async (folderId: Id<"folders">, name: string) => {
      if (!name.trim()) {
        return;
      }

      queryClient.setQueryData(folderKey, (old: Doc<"folders">[] | undefined) =>
        old?.map((f) => (f._id === folderId ? { ...f, name: name.trim() } : f))
      );

      try {
        await mutations.updateFolder({ id: folderId, name: name.trim() });
        toast.success("Folder renamed");
      } catch {
        queryClient.invalidateQueries({ queryKey: folderKey });
        toast.error("Failed to rename folder");
      }
    },
    [mutations, queryClient, folderKey]
  );

  const handleChangeFolderColor = useCallback(
    async (folderId: Id<"folders">, color: string) => {
      queryClient.setQueryData(folderKey, (old: Doc<"folders">[] | undefined) =>
        old?.map((f) => (f._id === folderId ? { ...f, color } : f))
      );

      try {
        await mutations.updateFolder({
          color: color as FolderColor,
          id: folderId,
        });
      } catch {
        queryClient.invalidateQueries({ queryKey: folderKey });
        toast.error("Failed to change folder color");
      }
    },
    [mutations, queryClient, folderKey]
  );

  const handleMoveFolder = useCallback(
    async (folderId: Id<"folders">, targetFolderId?: Id<"folders">) => {
      queryClient.setQueryData(folderKey, (old: Doc<"folders">[] | undefined) =>
        old?.filter((f) => f._id !== folderId)
      );

      try {
        await mutations.moveFolder({ id: folderId, parentId: targetFolderId });
        toast.success("Folder moved");
      } catch {
        queryClient.invalidateQueries({ queryKey: folderKey });
        toast.error("Failed to move folder");
      }
    },
    [mutations, queryClient, folderKey]
  );

  const handleDeleteFolder = useCallback(
    async (folderId: Id<"folders">) => {
      queryClient.setQueryData(folderKey, (old: Doc<"folders">[] | undefined) =>
        old?.filter((f) => f._id !== folderId)
      );

      try {
        await mutations.removeFolder({ id: folderId });
        toast.success("Folder deleted");
      } catch {
        queryClient.invalidateQueries({ queryKey: folderKey });
        toast.error("Failed to delete folder");
      }
    },
    [mutations, queryClient, folderKey]
  );

  const handleReorder = useCallback(
    async (items: ExplorerItem[]) => {
      const folderUpdates: { id: Id<"folders">; order: number }[] = [];
      const receiptUpdates: { id: Id<"receipts">; order: number }[] = [];

      for (const [index, entry] of items.entries()) {
        const order = index * 1000;
        if (entry.type === "folder") {
          folderUpdates.push({
            id: entry.item._id as Id<"folders">,
            order,
          });
        } else {
          receiptUpdates.push({
            id: entry.item._id as Id<"receipts">,
            order,
          });
        }
      }

      // Optimistic update
      queryClient.setQueryData(folderKey, (old: Doc<"folders">[] | undefined) =>
        old?.map((f) => {
          const update = folderUpdates.find((u) => u.id === f._id);
          return update ? { ...f, order: update.order } : f;
        })
      );
      queryClient.setQueryData(
        receiptKey,
        (old: Doc<"receipts">[] | undefined) =>
          old?.map((r) => {
            const update = receiptUpdates.find((u) => u.id === r._id);
            return update ? { ...r, order: update.order } : r;
          })
      );

      try {
        const promises: Promise<unknown>[] = [];
        if (folderUpdates.length > 0) {
          promises.push(mutations.reorderFolders({ items: folderUpdates }));
        }
        if (receiptUpdates.length > 0) {
          promises.push(mutations.reorderReceipts({ items: receiptUpdates }));
        }
        await Promise.all(promises);
      } catch {
        queryClient.invalidateQueries({ queryKey: folderKey });
        queryClient.invalidateQueries({ queryKey: receiptKey });
        toast.error("Failed to reorder");
      }
    },
    [mutations, queryClient, folderKey, receiptKey]
  );

  return {
    handleChangeFolderColor,
    handleCreateFolder,
    handleDeleteFolder,
    handleMoveFolder,
    handleRenameFolder,
    handleReorder,
  };
}

export function useReceiptActions(
  mutations: ReturnType<typeof useDashboardMutations>,
  currentFolderId?: Id<"folders">
) {
  const queryClient = useQueryClient();
  const receiptKey = useReceiptQueryKey(currentFolderId);

  const handleMoveReceipt = useCallback(
    async (receiptId: Id<"receipts">, targetFolderId?: Id<"folders">) => {
      queryClient.setQueryData(
        receiptKey,
        (old: Doc<"receipts">[] | undefined) =>
          old?.filter((r) => r._id !== receiptId)
      );

      try {
        await mutations.moveReceipt({
          folderId: targetFolderId,
          id: receiptId,
        });
        toast.success("Receipt moved");
      } catch {
        queryClient.invalidateQueries({ queryKey: receiptKey });
        toast.error("Failed to move receipt");
      }
    },
    [mutations, queryClient, receiptKey]
  );

  const handleDeleteReceipt = useCallback(
    async (receiptId: Id<"receipts">) => {
      queryClient.setQueryData(
        receiptKey,
        (old: Doc<"receipts">[] | undefined) =>
          old?.filter((r) => r._id !== receiptId)
      );

      try {
        await mutations.deleteReceipt({ id: receiptId });
        toast.success("Receipt deleted");
      } catch {
        queryClient.invalidateQueries({ queryKey: receiptKey });
        toast.error("Failed to delete receipt");
      }
    },
    [mutations, queryClient, receiptKey]
  );

  return { handleDeleteReceipt, handleMoveReceipt };
}

export function useFileUpload(
  mutations: ReturnType<typeof useDashboardMutations>,
  currentFolderId?: Id<"folders">
) {
  const [scanningCount, setScanningCount] = useState(0);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (!files || files.length === 0) {
        return;
      }

      const imageFiles = [...files].filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length === 0) {
        toast.error("Please upload image files only");
        return;
      }

      setScanningCount((c) => c + imageFiles.length);

      const toastId = toast.loading(
        `Scanning ${imageFiles.length} receipt${imageFiles.length > 1 ? "s" : ""}...`
      );

      try {
        for (const file of imageFiles) {
          const uploadUrl = await mutations.generateUploadUrl();
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
          await mutations.scanReceipt({ folderId: currentFolderId, storageId });
          setScanningCount((c) => Math.max(0, c - 1));
        }
        toast.success(
          `Successfully scanned ${imageFiles.length} receipt${imageFiles.length > 1 ? "s" : ""}`,
          { id: toastId }
        );
      } catch {
        toast.error("Failed to scan receipt", { id: toastId });
        setScanningCount(0);
      }

      e.target.value = "";
    },
    [currentFolderId, mutations]
  );

  return { handleUpload, scanningCount };
}
