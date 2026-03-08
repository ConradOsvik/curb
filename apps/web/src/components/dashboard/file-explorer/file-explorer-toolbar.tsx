import type { Id } from "@curb/backend/convex/_generated/dataModel";
import { FolderPlus, Home, Upload } from "lucide-react";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

import { ViewToggle } from "./view-toggle";

interface FileExplorerToolbarProps {
  path: { _id: Id<"folders">; name: string }[];
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onNavigate: (folderId?: Id<"folders">) => void;
}

export function FileExplorerToolbar({
  path,
  view,
  onViewChange,
  onNewFolder,
  onUpload,
  onNavigate,
}: FileExplorerToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={onNewFolder}>
            <FolderPlus className="mr-1.5 size-4" />
            New Folder
          </Button>
          <Button size="sm" onClick={onUpload}>
            <Upload className="mr-1.5 size-4" />
            Upload
          </Button>
        </div>
        <div className="h-4 w-px bg-border" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {path.length > 0 ? (
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => onNavigate()}
                >
                  <Home className="size-3.5" />
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>
                  <Home className="size-3.5" />
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {path.map((folder, i) => (
              <Fragment key={folder._id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {i === path.length - 1 ? (
                    <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="cursor-pointer"
                      onClick={() => onNavigate(folder._id)}
                    >
                      {folder.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <ViewToggle view={view} onViewChange={onViewChange} />
    </div>
  );
}
