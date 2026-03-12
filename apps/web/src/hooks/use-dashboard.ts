import type { Folder, FolderColor, ReceiptWithItems } from "@curb/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useTRPC } from "@/lib/trpc";

export type ExplorerItem =
  | { type: "folder"; item: Folder }
  | { type: "receipt"; item: ReceiptWithItems };

function getItemName(item: ExplorerItem): string {
  if (item.type === "folder") {
    return item.item.name;
  }
  return item.item.merchantName;
}

export function sortItems(items: ExplorerItem[]): ExplorerItem[] {
  return [...items].toSorted((a: ExplorerItem, b: ExplorerItem) => {
    // Folders first, then receipts
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }
    // Folders: alphabetically by name
    if (a.type === "folder") {
      return getItemName(a).localeCompare(getItemName(b));
    }
    // Receipts: newest date first (a.type === "receipt" after folder check above)
    if (a.type === "receipt" && b.type === "receipt") {
      return b.item.date.localeCompare(a.item.date);
    }
    return 0;
  });
}

const FOLDER_SESSION_KEY = "curb:currentFolder";

export function useDashboardState() {
  const search = useSearch({ from: "/_app/dashboard" });
  const navigate = useNavigate();

  // Restore from sessionStorage on mount if URL has no folder param
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (hasRestoredRef.current) {
      return;
    }
    hasRestoredRef.current = true;

    if (!search.folder) {
      const saved = sessionStorage.getItem(FOLDER_SESSION_KEY);
      if (saved) {
        void navigate({
          replace: true,
          search: { folder: saved },
          to: "/dashboard",
        });
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentFolderId = search.folder;

  // Keep sessionStorage in sync with URL
  useEffect(() => {
    if (currentFolderId) {
      sessionStorage.setItem(FOLDER_SESSION_KEY, currentFolderId);
    } else {
      sessionStorage.removeItem(FOLDER_SESSION_KEY);
    }
  }, [currentFolderId]);

  const setCurrentFolderId = useCallback(
    (folderId?: string) => {
      void navigate({
        search: { folder: folderId },
        to: "/dashboard",
      });
    },
    [navigate]
  );

  const [viewingReceipt, setViewingReceipt] = useState<ReceiptWithItems | null>(
    null
  );

  return {
    currentFolderId,
    setCurrentFolderId,
    setViewingReceipt,
    viewingReceipt,
  };
}

export function useDashboardQueries(currentFolderId: string | undefined) {
  const trpc = useTRPC();

  const { data: folders = [] } = useQuery(
    trpc.folders.listByParent.queryOptions({ parentId: currentFolderId })
  );

  const { data: allFolders = [] } = useQuery(
    trpc.folders.listAll.queryOptions()
  );

  const { data: path = [] } = useQuery(
    trpc.folders.getPath.queryOptions({ folderId: currentFolderId })
  );

  const { data: receipts = [] } = useQuery(
    trpc.receipts.listWithFilters.queryOptions({
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
  const trpc = useTRPC();

  return {
    createFolder: useMutation(trpc.folders.create.mutationOptions()),
    deleteReceipt: useMutation(trpc.receipts.delete.mutationOptions()),
    moveFolder: useMutation(trpc.folders.move.mutationOptions()),
    moveReceipt: useMutation(trpc.receipts.move.mutationOptions()),
    removeFolder: useMutation(trpc.folders.remove.mutationOptions()),
    scanReceipt: useMutation(trpc.receipts.scan.mutationOptions()),
    updateFolder: useMutation(trpc.folders.update.mutationOptions()),
    uploadUrl: useMutation(trpc.storage.getUploadUrl.mutationOptions()),
  };
}

/**
 * Invalidate all folder and receipt queries so the UI stays in sync
 * after any mutation. This runs in the background — optimistic updates
 * keep the current view responsive.
 *
 * Uses path-prefix matching: [["folders"]] matches all folder queries
 * regardless of procedure or input.
 */
function useInvalidateAll() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [["folders"]] });
    void queryClient.invalidateQueries({ queryKey: [["receipts"]] });
  }, [queryClient]);
}

export function useFolderActions(
  mutations: ReturnType<typeof useDashboardMutations>,
  state: ReturnType<typeof useDashboardState>
) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidateAll = useInvalidateAll();

  const folderKey = trpc.folders.listByParent.queryOptions({
    parentId: state.currentFolderId,
  }).queryKey;

  const handleCreateFolder = useCallback(
    async (name: string) => {
      if (!name.trim()) {
        return;
      }

      const tempId = `temp_${Date.now()}`;
      const now = Date.now();
      const optimisticFolder: Folder = {
        color: null,
        createdAt: now,
        deletedAt: null,
        id: tempId,
        name: name.trim(),
        order: now,
        parentId: state.currentFolderId ?? "",
        userId: "",
      };

      queryClient.setQueryData(folderKey, (old: Folder[] | undefined) => [
        ...(old ?? []),
        optimisticFolder,
      ]);

      try {
        await mutations.createFolder.mutateAsync({
          name: name.trim(),
          parentId: state.currentFolderId,
        });
        invalidateAll();
      } catch {
        invalidateAll();
        toast.error("Failed to create folder");
      }
    },
    [mutations, state.currentFolderId, queryClient, folderKey, invalidateAll]
  );

  const handleRenameFolder = useCallback(
    async (folderId: string, name: string) => {
      if (!name.trim()) {
        return;
      }

      queryClient.setQueryData(folderKey, (old: Folder[] | undefined) =>
        old?.map((f) => (f.id === folderId ? { ...f, name: name.trim() } : f))
      );

      try {
        await mutations.updateFolder.mutateAsync({
          id: folderId,
          name: name.trim(),
        });
        invalidateAll();
      } catch {
        invalidateAll();
        toast.error("Failed to rename folder");
      }
    },
    [mutations, queryClient, folderKey, invalidateAll]
  );

  const handleChangeFolderColor = useCallback(
    async (folderId: string, color: string) => {
      queryClient.setQueryData(folderKey, (old: Folder[] | undefined) =>
        old?.map((f) => (f.id === folderId ? { ...f, color } : f))
      );

      try {
        await mutations.updateFolder.mutateAsync({
          color: color as FolderColor,
          id: folderId,
        });
        invalidateAll();
      } catch {
        invalidateAll();
        toast.error("Failed to change folder color");
      }
    },
    [mutations, queryClient, folderKey, invalidateAll]
  );

  const handleMoveFolder = useCallback(
    async (folderId: string, targetFolderId?: string) => {
      // Grab folder data before removing from cache
      const currentFolders = queryClient.getQueryData<Folder[]>(folderKey);
      const movedFolder =
        currentFolders?.find((f) => f.id === folderId) ??
        queryClient
          .getQueryData<Folder[]>(trpc.folders.listAll.queryOptions().queryKey)
          ?.find((f) => f.id === folderId);

      // Optimistic: remove from current view
      queryClient.setQueryData(folderKey, (old: Folder[] | undefined) =>
        old?.filter((f) => f.id !== folderId)
      );

      // Optimistic: add to target folder's cache if it exists
      if (movedFolder) {
        const targetKey = trpc.folders.listByParent.queryOptions({
          parentId: targetFolderId,
        }).queryKey;
        queryClient.setQueryData(
          targetKey,
          (old: Folder[] | undefined) =>
            old && [...old, { ...movedFolder, parentId: targetFolderId ?? "" }]
        );
      }

      try {
        await mutations.moveFolder.mutateAsync({
          id: folderId,
          parentId: targetFolderId,
        });
        invalidateAll();
      } catch {
        invalidateAll();
        toast.error("Failed to move folder");
      }
    },
    [mutations, queryClient, folderKey, trpc, invalidateAll]
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      queryClient.setQueryData(folderKey, (old: Folder[] | undefined) =>
        old?.filter((f) => f.id !== folderId)
      );

      try {
        await mutations.removeFolder.mutateAsync({ id: folderId });
        invalidateAll();
        toast.success("Moved to trash");
      } catch {
        invalidateAll();
        toast.error("Failed to delete folder");
      }
    },
    [mutations, queryClient, folderKey, invalidateAll]
  );

  return {
    handleChangeFolderColor,
    handleCreateFolder,
    handleDeleteFolder,
    handleMoveFolder,
    handleRenameFolder,
  };
}

export function useReceiptActions(
  mutations: ReturnType<typeof useDashboardMutations>,
  currentFolderId?: string
) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidateAll = useInvalidateAll();

  const receiptKey = trpc.receipts.listWithFilters.queryOptions({
    folderId: currentFolderId,
  }).queryKey;

  const handleMoveReceipt = useCallback(
    async (receiptId: string, targetFolderId?: string) => {
      // Optimistic: get the receipt before removing from cache
      const receipts = queryClient.getQueryData<ReceiptWithItems[]>(receiptKey);
      const receipt = receipts?.find((r) => r.id === receiptId);

      // Remove from current view
      queryClient.setQueryData(
        receiptKey,
        (old: ReceiptWithItems[] | undefined) =>
          old?.filter((r) => r.id !== receiptId)
      );

      // Add to target folder's cache if it exists
      if (receipt) {
        const targetKey = trpc.receipts.listWithFilters.queryOptions({
          folderId: targetFolderId,
        }).queryKey;
        queryClient.setQueryData(
          targetKey,
          (old: ReceiptWithItems[] | undefined) =>
            old && [...old, { ...receipt, folderId: targetFolderId ?? "" }]
        );
      }

      try {
        await mutations.moveReceipt.mutateAsync({
          folderId: targetFolderId,
          id: receiptId,
        });
        invalidateAll();
      } catch {
        invalidateAll();
        toast.error("Failed to move receipt");
      }
    },
    [mutations, queryClient, receiptKey, trpc, invalidateAll]
  );

  const handleDeleteReceipt = useCallback(
    async (receiptId: string) => {
      queryClient.setQueryData(
        receiptKey,
        (old: ReceiptWithItems[] | undefined) =>
          old?.filter((r) => r.id !== receiptId)
      );

      try {
        await mutations.deleteReceipt.mutateAsync({ id: receiptId });
        invalidateAll();
        toast.success("Moved to trash");
      } catch {
        invalidateAll();
        toast.error("Failed to delete receipt");
      }
    },
    [mutations, queryClient, receiptKey, invalidateAll]
  );

  return { handleDeleteReceipt, handleMoveReceipt };
}

export function useFileUpload(
  mutations: ReturnType<typeof useDashboardMutations>,
  currentFolderId?: string
) {
  const [scanningCount, setScanningCount] = useState(0);
  const invalidateAll = useInvalidateAll();

  const uploadFiles = useCallback(
    async (imageFiles: File[]) => {
      if (imageFiles.length === 0) {
        toast.error("Please upload image files only");
        return;
      }

      setScanningCount((c) => c + imageFiles.length);

      const toastId = toast.loading(
        `Scanning ${imageFiles.length} receipt${imageFiles.length > 1 ? "s" : ""}...`
      );

      const results = await Promise.allSettled(
        imageFiles.map(async (file) => {
          const { url, key } = await mutations.uploadUrl.mutateAsync({
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

          await mutations.scanReceipt.mutateAsync({
            folderId: currentFolderId,
            storageKey: key,
          });

          setScanningCount((c) => Math.max(0, c - 1));
        })
      );

      invalidateAll();

      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;

      if (failed === 0) {
        toast.success(
          `Successfully scanned ${succeeded} receipt${succeeded > 1 ? "s" : ""}`,
          { id: toastId }
        );
      } else if (succeeded === 0) {
        toast.error("Failed to scan receipts", { id: toastId });
        setScanningCount(0);
      } else {
        toast.error(
          `Scanned ${String(succeeded)} receipt${succeeded > 1 ? "s" : ""}, ${String(failed)} failed`,
          { id: toastId }
        );
        setScanningCount(0);
      }
    },
    [currentFolderId, mutations, invalidateAll]
  );

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (!files || files.length === 0) {
        return;
      }

      const imageFiles = [...files].filter((file) =>
        file.type.startsWith("image/")
      );

      void uploadFiles(imageFiles);
      e.target.value = "";
    },
    [uploadFiles]
  );

  return { handleUpload, scanningCount, uploadFiles };
}
