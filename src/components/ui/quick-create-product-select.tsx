"use client";

import { useState, useEffect } from "react";
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
import { QCOption } from "./quick-create-select";

const selectCls =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";

interface QuickCreateProductSelectProps {
  value: number | string;
  onChange: (id: number) => void;
  options: QCOption[];
  onAdd: (item: QCOption) => void;
  placeholder?: string;
  required?: boolean;
  selectClassName?: string;
  compact?: boolean;
}

export function QuickCreateProductSelect({
  value,
  onChange,
  options,
  onAdd,
  placeholder,
  required,
  selectClassName,
  compact = false,
}: QuickCreateProductSelectProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [categories, setCategories] = useState<QCOption[]>([]);
  const [units, setUnits] = useState<QCOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/masters/categories").then((r) => r.json()),
      fetch("/api/masters/units").then((r) => r.json()),
    ]).then(([cats, uns]) => {
      setCategories(cats);
      setUnits(uns);
    });
  }, [open]);

  const reset = () => {
    setName("");
    setCategoryId("");
    setUnitId("");
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || !categoryId || !unitId) {
      toast.error("Name, Category and Unit are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/masters/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, categoryId, unitId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create product");
      }
      const created = await res.json();
      const newItem: QCOption = { id: created.id, name: created.name };
      onAdd(newItem);
      onChange(created.id);
      setOpen(false);
      reset();
      toast.success("Product created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create product");
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
          <option value="">{placeholder ?? "Select Product"}</option>
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
          title="Add new product"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="qcp-name">Name *</Label>
              <Input
                id="qcp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name..."
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qcp-cat">Category *</Label>
              <select
                id="qcp-cat"
                className={selectCls}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qcp-unit">Unit *</Label>
              <select
                id="qcp-unit"
                className={selectCls}
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
              >
                <option value="">Select unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!name.trim() || !categoryId || !unitId || saving}
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
