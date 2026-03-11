import { ArrowPathIcon } from "@heroicons/react/24/solid";

export function ScanningPlaceholderRow() {
  return (
    <div className="flex h-10 animate-pulse items-center gap-3 border-b px-4 text-sm opacity-50">
      <ArrowPathIcon className="size-4 shrink-0 animate-spin text-muted-foreground" />
      <span className="flex-1 truncate text-muted-foreground">
        Scanning receipt...
      </span>
      <span className="w-20 shrink-0">&mdash;</span>
      <span className="w-28 shrink-0">&mdash;</span>
      <span className="w-24 shrink-0 text-right">&mdash;</span>
    </div>
  );
}

export function ScanningPlaceholderCard() {
  return (
    <div className="flex h-full w-full flex-col p-1.5 animate-pulse opacity-60">
      <svg
        className="block w-full text-white drop-shadow-[0_-1px_0_rgba(0,0,0,0.05)] dark:text-gray-100 dark:drop-shadow-none"
        viewBox="0 0 120 5"
        preserveAspectRatio="none"
        height="5"
      >
        <path
          d="M0,5 H120 V0 A5,5 0 0,1 110,0 A5,5 0 0,1 100,0 A5,5 0 0,1 90,0 A5,5 0 0,1 80,0 A5,5 0 0,1 70,0 A5,5 0 0,1 60,0 A5,5 0 0,1 50,0 A5,5 0 0,1 40,0 A5,5 0 0,1 30,0 A5,5 0 0,1 20,0 A5,5 0 0,1 10,0 A5,5 0 0,1 0,0 Z"
          fill="currentColor"
        />
      </svg>
      <div className="flex flex-1 flex-col gap-1.5 bg-white px-2 py-2 shadow-sm ring-1 ring-black/5 dark:bg-gray-100 dark:shadow-none dark:ring-0">
        <div className="flex items-center gap-2">
          <ArrowPathIcon className="size-3.5 animate-spin text-gray-400" />
          <span className="text-xs text-gray-400">Scanning...</span>
        </div>
        <div className="h-2.5 w-2/3 rounded bg-gray-200" />
        <div className="h-2.5 w-1/3 rounded bg-gray-200" />
      </div>
      <svg
        className="block w-full text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:text-gray-100 dark:drop-shadow-none"
        viewBox="0 0 120 5"
        preserveAspectRatio="none"
        height="5"
      >
        <path
          d="M0,0 H120 V5 A5,5 0 0,0 110,5 A5,5 0 0,0 100,5 A5,5 0 0,0 90,5 A5,5 0 0,0 80,5 A5,5 0 0,0 70,5 A5,5 0 0,0 60,5 A5,5 0 0,0 50,5 A5,5 0 0,0 40,5 A5,5 0 0,0 30,5 A5,5 0 0,0 20,5 A5,5 0 0,0 10,5 A5,5 0 0,0 0,5 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
