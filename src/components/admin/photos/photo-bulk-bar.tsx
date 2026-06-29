import { Eye, EyeOff, Lock, Star, Trash2, X } from "lucide-react";

import { AppSelect } from "@/components/app-select";
import { Button } from "@/components/ui/button";
import type { PhotoCategory } from "@/lib/media-types";
import { NO_PHOTO_FOLDER, type AdminPhotosPageState } from "@/hooks/admin/use-admin-photos";

type PhotoBulkBarProps = Pick<
  AdminPhotosPageState,
  | "selectedCount"
  | "bulkWorking"
  | "runBulkUpdate"
  | "bulkFolder"
  | "setBulkFolder"
  | "folderOptions"
  | "bulkCategory"
  | "setBulkCategory"
  | "categoryOptions"
  | "clearSelection"
  | "setBulkDeleteOpen"
>;

function BulkButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: typeof Eye;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onClick}>
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

export function PhotoBulkBar({
  selectedCount,
  bulkWorking,
  runBulkUpdate,
  bulkFolder,
  setBulkFolder,
  folderOptions,
  bulkCategory,
  setBulkCategory,
  categoryOptions,
  clearSelection,
  setBulkDeleteOpen,
}: PhotoBulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/95 px-4 py-3 shadow-card backdrop-blur-sm">
      <span className="mr-1 text-sm font-medium">{selectedCount} selected</span>
      <BulkButton
        disabled={bulkWorking}
        onClick={() => void runBulkUpdate({ published: true })}
        icon={Eye}
        label="Publish"
      />
      <BulkButton
        disabled={bulkWorking}
        onClick={() => void runBulkUpdate({ published: false })}
        icon={EyeOff}
        label="Unpublish"
      />
      <BulkButton
        disabled={bulkWorking}
        onClick={() => void runBulkUpdate({ featured: true })}
        icon={Star}
        label="Feature"
      />
      <BulkButton
        disabled={bulkWorking}
        onClick={() => void runBulkUpdate({ featured: false })}
        icon={Star}
        label="Unfeature"
      />
      <BulkButton
        disabled={bulkWorking}
        onClick={() => void runBulkUpdate({ public_watermarked: true })}
        icon={Lock}
        label="Watermark"
      />
      <BulkButton
        disabled={bulkWorking}
        onClick={() => void runBulkUpdate({ public_watermarked: false })}
        icon={Lock}
        label="Unwatermark"
      />
      <AppSelect
        size="sm"
        className="w-[8.5rem]"
        value={bulkFolder}
        onValueChange={setBulkFolder}
        options={folderOptions}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={bulkWorking}
        onClick={() =>
          void runBulkUpdate({
            folder_id: bulkFolder === NO_PHOTO_FOLDER ? null : bulkFolder,
          })
        }
      >
        Move to folder
      </Button>
      <div className="hidden h-5 w-px bg-border sm:block" />
      <AppSelect
        size="sm"
        className="w-[8.5rem]"
        value={bulkCategory}
        onValueChange={(v) => setBulkCategory(v as PhotoCategory)}
        options={categoryOptions}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={bulkWorking}
        onClick={() => void runBulkUpdate({ category: bulkCategory })}
      >
        Set category
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={bulkWorking}
        className="text-destructive hover:text-destructive"
        onClick={() => setBulkDeleteOpen(true)}
      >
        <Trash2 /> Delete
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="ml-auto h-8 w-8"
        onClick={clearSelection}
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
