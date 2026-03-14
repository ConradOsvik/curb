import type { SheetListItem } from "@curb/api";
import { PlusIcon, TableCellsIcon } from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_app/sheets/")({
  component: SheetsPage,
});

function SheetsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: sheets = [] } = useQuery(trpc.sheets.list.queryOptions());

  const createSheet = useMutation(
    trpc.sheets.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [["sheets"]] });
      },
    })
  );

  const handleCreate = () => {
    createSheet.mutate({ name: "Untitled Budget" });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sheets</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your budget spreadsheets
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={createSheet.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <PlusIcon className="size-4" />
          New Sheet
        </button>
      </div>

      {sheets.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-muted p-4">
            <TableCellsIcon className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No sheets yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first budget sheet to get started
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={createSheet.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <PlusIcon className="size-4" />
            New Sheet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sheets.map((sheet) => (
            <SheetCard key={sheet.id} sheet={sheet} />
          ))}
        </div>
      )}
    </div>
  );
}

function SheetCard({ sheet }: { sheet: SheetListItem }) {
  return (
    <Link
      to="/sheets/$sheetId"
      params={{ sheetId: sheet.id }}
      className="group flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-start gap-3">
        <TableCellsIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{sheet.name}</p>
          {sheet.description && (
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {sheet.description}
            </p>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {sheet.createdAt ? new Date(sheet.createdAt).toLocaleDateString() : ""}
      </p>
    </Link>
  );
}
