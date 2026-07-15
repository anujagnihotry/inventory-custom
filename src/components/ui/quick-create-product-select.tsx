"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  disabled?: boolean;
}

// Inline add widget — appears below a select when the + button is clicked
function InlineAdd({
  label,
  onSave,
  onCancel,
}: {
  label: string;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim());
      setName("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-1.5 items-center mt-1.5">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={`New ${label} name...`}
        className="h-8 text-xs"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
          if (e.key === "Escape") onCancel();
        }}
      />
      <Button
        type="button"
        size="sm"
        className="h-8 px-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
        onClick={handleSave}
        disabled={saving || !name.trim()}
      >
        {saving ? "..." : "Add"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs shrink-0"
        onClick={onCancel}
      >
        ✕
      </Button>
    </div>
  );
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
  disabled = false,
}: QuickCreateProductSelectProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [mil, setMil] = useState("");
  const [hsn, setHsn] = useState("");
  const [gst, setGst] = useState("");
  const [description, setDescription] = useState("");

  // Dropdown data
  const [categories, setCategories] = useState<QCOption[]>([]);
  const [subCategories, setSubCategories] = useState<QCOption[]>([]);
  const [units, setUnits] = useState<QCOption[]>([]);

  // Inline-add visibility
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingSubCategory, setAddingSubCategory] = useState(false);
  const [addingUnit, setAddingUnit] = useState(false);

  // Load categories and units when dialog opens
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

  // Load sub-categories when category changes
  const loadSubCategories = useCallback(async (catId: string) => {
    if (!catId) { setSubCategories([]); return; }
    const res = await fetch(`/api/masters/subcategories?categoryId=${catId}`);
    if (res.ok) setSubCategories(await res.json());
    else setSubCategories([]);
  }, []);

  useEffect(() => {
    setSubCategoryId("");
    loadSubCategories(categoryId);
  }, [categoryId, loadSubCategories]);

  const reset = () => {
    setName("");
    setCategoryId("");
    setSubCategoryId("");
    setUnitId("");
    setMil("");
    setHsn("");
    setGst("");
    setDescription("");
    setSubCategories([]);
    setAddingCategory(false);
    setAddingSubCategory(false);
    setAddingUnit(false);
  };

  // Inline add handlers
  const handleAddCategory = async (catName: string) => {
    const res = await fetch("/api/masters/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName }),
    });
    if (!res.ok) { toast.error("Failed to create category"); return; }
    const created = await res.json();
    setCategories((prev) => [...prev, { id: created.id, name: created.name }]);
    setCategoryId(String(created.id));
    setAddingCategory(false);
    toast.success("Category created");
  };

  const handleAddSubCategory = async (scName: string) => {
    if (!categoryId) { toast.error("Select a category first"); return; }
    const res = await fetch("/api/masters/subcategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: scName, categoryId }),
    });
    if (!res.ok) { toast.error("Failed to create sub category"); return; }
    const created = await res.json();
    setSubCategories((prev) => [...prev, { id: created.id, name: created.name }]);
    setSubCategoryId(String(created.id));
    setAddingSubCategory(false);
    toast.success("Sub category created");
  };

  const handleAddUnit = async (unitName: string) => {
    const res = await fetch("/api/masters/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: unitName }),
    });
    if (!res.ok) { toast.error("Failed to create unit"); return; }
    const created = await res.json();
    setUnits((prev) => [...prev, { id: created.id, name: created.name }]);
    setUnitId(String(created.id));
    setAddingUnit(false);
    toast.success("Unit created");
  };

  const handleCreate = async () => {
    if (!name.trim() || !categoryId || !unitId) {
      toast.error("Name, Category and Unit are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/masters/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categoryId,
          subCategoryId: subCategoryId || undefined,
          unitId,
          mil: mil || undefined,
          hsn: hsn || undefined,
          gst: gst ? Number(gst) : 0,
          description: description || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create product");
      }
      const created = await res.json();
      onAdd({ id: created.id, name: created.name });
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
            disabled && "opacity-50 cursor-not-allowed",
            selectClassName
          )}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          required={required}
          disabled={disabled}
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
          disabled={disabled}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Product name"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <div className="flex gap-1.5 items-center">
                  <select
                    className={selectCls}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 border-dashed hover:border-indigo-400 hover:text-indigo-600"
                    onClick={() => { setAddingCategory(true); setAddingSubCategory(false); }}
                    title="Add category"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {addingCategory && (
                  <InlineAdd
                    label="Category"
                    onSave={handleAddCategory}
                    onCancel={() => setAddingCategory(false)}
                  />
                )}
              </div>

              {/* Sub Category */}
              <div className="space-y-1.5">
                <Label>Sub Category</Label>
                <div className="flex gap-1.5 items-center">
                  <select
                    className={selectCls}
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    disabled={!categoryId}
                  >
                    <option value="">Select sub category</option>
                    {subCategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 border-dashed hover:border-indigo-400 hover:text-indigo-600"
                    onClick={() => { setAddingSubCategory(true); setAddingCategory(false); }}
                    disabled={!categoryId}
                    title="Add sub category"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {addingSubCategory && (
                  <InlineAdd
                    label="Sub Category"
                    onSave={handleAddSubCategory}
                    onCancel={() => setAddingSubCategory(false)}
                  />
                )}
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <Label>Unit *</Label>
                <div className="flex gap-1.5 items-center">
                  <select
                    className={selectCls}
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                  >
                    <option value="">Select unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 border-dashed hover:border-indigo-400 hover:text-indigo-600"
                    onClick={() => { setAddingUnit(true); }}
                    title="Add unit"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {addingUnit && (
                  <InlineAdd
                    label="Unit"
                    onSave={handleAddUnit}
                    onCancel={() => setAddingUnit(false)}
                  />
                )}
              </div>

              {/* MIL Number */}
              <div className="space-y-1.5">
                <Label>MIL Number</Label>
                <Input
                  value={mil}
                  onChange={(e) => setMil(e.target.value)}
                  placeholder="MIL number"
                />
              </div>

              {/* HSN Code */}
              <div className="space-y-1.5">
                <Label>HSN Code</Label>
                <Input
                  value={hsn}
                  onChange={(e) => setHsn(e.target.value)}
                  placeholder="e.g. 73084000"
                />
              </div>

              {/* GST % */}
              <div className="space-y-1.5">
                <Label>GST %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  placeholder="e.g. 18"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional description"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setOpen(false); reset(); }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!name.trim() || !categoryId || !unitId || saving}
                onClick={handleCreate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98] transition-all"
              >
                {saving ? "Creating..." : "Create Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
