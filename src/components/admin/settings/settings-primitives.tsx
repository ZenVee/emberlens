import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SettingsPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-xl border border-border/60 bg-card p-5 shadow-card sm:p-6", className)}
    >
      <header className="mb-5 border-b border-border/40 pb-4">
        <h2 className="font-display text-base font-medium">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}

export function FormField({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline gap-2">
        <Label className="text-muted-foreground">{label}</Label>
        {hint && <span className="text-xs text-muted-foreground/70">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function CategoryListEditor({
  label,
  hint,
  items,
  onChange,
  onItemChange,
  onBlur,
  placeholder = "Category name",
  addLabel = "Add category",
  className,
}: {
  label: string;
  hint: string;
  items: string[];
  onChange: (items: string[]) => void;
  onItemChange: (index: number, value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  addLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => onItemChange(index, e.target.value)}
              onBlur={onBlur}
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${label} ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, ""])}
        className="rounded-full"
      >
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}

export function ColorField({
  label,
  hint,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <FormField label={label} hint={hint}>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onBlur?.();
          }}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border/60 bg-transparent p-1"
          aria-label={`${label} color picker`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="#000000"
          className="font-mono text-sm"
        />
      </div>
    </FormField>
  );
}
