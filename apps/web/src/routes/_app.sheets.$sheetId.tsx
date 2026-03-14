import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { SheetTable } from "@/components/sheets/sheet-table";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_app/sheets/$sheetId")({
  component: SheetPage,
});

function SheetPage() {
  const { sheetId } = Route.useParams();
  const trpc = useTRPC();
  const { data: sheet, isLoading } = useQuery(
    trpc.sheets.get.queryOptions({ id: sheetId })
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Sheet not found</p>
        <Link
          to="/sheets"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to sheets
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link
          to="/sheets"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <h1 className="text-lg font-semibold">{sheet.name}</h1>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <SheetTable sheet={sheet} />
      </div>
    </div>
  );
}
