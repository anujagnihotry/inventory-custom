"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface QCOption {
  id: number;
  name: string;
}

interface QuickCreateSelectProps {
  label: string;
  value: number | string;
  onChange: (id: number) => void;
  options: QCOption[];
  onAdd: (item: QCOption) => void;
  createUrl: string;
  placeholder?: string;
  required?: boolean;
  selectClassName?: string;
  compact?: boolean; // smaller height for table cells
}

export function QuickCreateSelect({
  label,
  value,
  onChange,
  options,
  onAdd,
  createUrl,
  placeholder,
  required,
  selectClassName,
  compact = false,
}: QuickCreateSelectProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create");
      }
      const created = await res.json();
      const newItem: QCOption = { id: created.id, name: created.name };
      onAdd(newItem);
      onChange(created.id);
      setOpen(false);
      setName("");
      toast.success(`${label} created`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Failed to create ${label}`);
    } finally {
      setSaving(false);
    }
  };

  const h = compact ? "h-9" : "h-10";
  const btnH = compact ? "h-9 w-9" : "h-10 w-10";

  return (
    <>
      <div className="flex gap-1.5 items-center w-full">
        <select
          className={cn(
            `flex ${h} w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400`,
            selectClassName
          )}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          required={required}
        >
          <option value="">{placeholder ?? `Select ${label}`}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(`${btnH} shrink-0 border-dashed hover:border-indigo-400 hover:text-indigo-600`)}
          onClick={() => setOpen(true)}
          title={`Add new ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setName("");
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New {label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="qc-name">Name *</Label>
              <Input
                id="qc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                placeholder={`Enter ${label.toLowerCase()} name...`}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setName("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!name.trim() || saving}
                onClick={handleCreate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98] transition-all"
              >
                {saving ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
