import { Search, Grid3x3, List, SlidersHorizontal } from "lucide-react";

import { AppSelect } from "@/components/app-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { PhotoCategory } from "@/lib/media-types";
import { cn } from "@/lib/utils";
import {
  PHOTO_STATUS_FILTERS,
  type AdminPhotosPageState,
  type PhotoStatusFilter,
} from "@/hooks/admin/use-admin-photos";

type PhotoFiltersProps = Pick<
  AdminPhotosPageState,
  | "photos"
  | "query"
  | "setQuery"
  | "statusFilter"
  | "setStatusFilter"
  | "categoryFilter"
  | "setCategoryFilter"
  | "categoryFilterOptions"
  | "view"
  | "setView"
  | "filtered"
  | "allFilteredSelected"
  | "someFilteredSelected"
  | "toggleSelectAllFiltered"
  | "hasActiveFilters"
  | "clearFilters"
>;

export function PhotoFilters({
  photos,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  categoryFilterOptions,
  view,
  setView,
  filtered,
  allFilteredSelected,
  someFilteredSelected,
  toggleSelectAllFiltered,
  hasActiveFilters,
  clearFilters,
}: PhotoFiltersProps) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 border-border/60 bg-background pl-9"
            placeholder="Search by title or category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {PHOTO_STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === value
                    ? "bg-gradient-ember text-primary-foreground shadow-glow"
                    : "bg-secondary/80 text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <AppSelect
            className="w-[11rem]"
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v === "all" ? "all" : (v as PhotoCategory))}
            options={categoryFilterOptions}
          />

          <div className="flex rounded-lg border border-border/60 bg-background p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-md transition-colors",
                view === "grid"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-md transition-colors",
                view === "list"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <Checkbox
            checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
            onCheckedChange={() => toggleSelectAllFiltered()}
            disabled={filtered.length === 0}
          />
          <span className="text-muted-foreground">
            Select {filtered.length === photos.length ? "all" : "filtered"}
          </span>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>
    </section>
  );
}

export type { PhotoStatusFilter };
