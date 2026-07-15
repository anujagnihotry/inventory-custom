"use client";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  subCategoryId: z.string().optional(),
  unitId: z.string().min(1, "Unit is required"),
  description: z.string().optional(),
  mil: z.string().optional(),
  gst: z.string().optional(),
  hsn: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  categoryId: string;
  subCategoryId?: string;
  unitId: string;
  description?: string;
  mil?: string;
  gst?: string;
  hsn?: string;
  itemCode?: string;
  category?: { id: string; name: string };
  subCategory?: { id: string; name: string };
  unit?: { id: string; name: string };
}

interface SelectOption { id: string; name: string; }

const selectClass = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [subCategories, setSubCategories] = useState<SelectOption[]>([]);
  const [units, setUnits] = useState<SelectOption[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", categoryId: "", subCategoryId: "", unitId: "", description: "", mil: "", gst: "", hsn: "" },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/masters/products");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [catRes, unitRes] = await Promise.all([fetch("/api/masters/categories"), fetch("/api/masters/units")]);
      if (catRes.ok) setCategories(await catRes.json());
      if (unitRes.ok) setUnits(await unitRes.json());
    } catch {
      toast.error("Failed to load dropdown data");
    }
  };

  const fetchSubCategories = useCallback(async (categoryId: string) => {
    if (!categoryId) { setSubCategories([]); return; }
    try {
      const res = await fetch(`/api/masters/subcategories?categoryId=${categoryId}`);
      if (res.ok) setSubCategories(await res.json());
      else setSubCategories([]);
    } catch {
      setSubCategories([]);
    }
  }, []);

  const selectedCategoryId = form.watch("categoryId");
  const [lastCategoryId, setLastCategoryId] = useState<string>("");

  useEffect(() => {
    fetchSubCategories(selectedCategoryId);
    if (lastCategoryId && lastCategoryId !== selectedCategoryId) form.setValue("subCategoryId", "");
    setLastCategoryId(selectedCategoryId);
  }, [selectedCategoryId, fetchSubCategories]);

  useEffect(() => { fetchData(); fetchDropdowns(); }, []);

  const onSubmit = async (values: ProductFormData) => {
    try {
      const url = editingItem ? `/api/masters/products/${editingItem.id}` : "/api/masters/products";
      const res = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, subCategoryId: values.subCategoryId || undefined, gst: values.gst || 0 }),
      });
      if (!res.ok) throw new Error();
      toast.success(editingItem ? "Product updated" : "Product created");
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
      fetchData();
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleEdit = async (item: Product) => {
    setEditingItem(item);
    if (item.categoryId) await fetchSubCategories(String(item.categoryId));
    form.reset({
      name: item.name,
      categoryId: String(item.categoryId),
      subCategoryId: item.subCategoryId ? String(item.subCategoryId) : "",
      unitId: String(item.unitId),
      description: item.description || "",
      mil: item.mil || "",
      gst: item.gst || "",
      hsn: item.hsn || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/masters/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete product");
      toast.success("Product deleted");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete product");
    } finally {
      setDeleting(null);
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open);
    if (!open) { setEditingItem(null); setLastCategoryId(""); setSubCategories([]); form.reset({ name: "", categoryId: "", subCategoryId: "", unitId: "", description: "", mil: "", gst: "", hsn: "" }); }
  };

  const columns: ColumnDef<Product>[] = [
    { accessorKey: "itemCode", header: "Item Code" },
    { accessorKey: "hsn", header: "HSN Code" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "category.name", header: "Category" },
    { accessorKey: "subCategory.name", header: "Sub Category" },
    { accessorKey: "unit.name", header: "Unit" },
    {
      accessorKey: "gst",
      header: "GST %",
      cell: ({ row }) => row.original.gst ? `${Number(row.original.gst).toFixed(2)}%` : "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)} className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)} disabled={deleting === row.original.id} className="h-8 w-8 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Products"
        description="All stock items tracked in the inventory."
        action={
          <Button onClick={() => { setEditingItem(null); setLastCategoryId(""); setSubCategories([]); form.reset({ name: "", categoryId: "", subCategoryId: "", unitId: "", description: "", mil: "", gst: "", hsn: "" }); setDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 active:scale-[0.98] transition-all">
            <Plus className="mr-1.5 h-4 w-4" /> Add Product
          </Button>
        }
      />

      {loading ? <SkeletonTable rows={6} cols={5} /> : <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Search products..." />}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Item Code</Label>
                <div className="flex h-10 w-full items-center rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {editingItem?.itemCode ?? "Auto-generated (e.g. SC0001)"}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="categoryId">Category *</Label>
                <select id="categoryId" className={selectClass} {...form.register("categoryId")}>
                  <option value="">Select category</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                {form.formState.errors.categoryId && <p className="text-xs text-red-600">{form.formState.errors.categoryId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subCategoryId">Sub Category</Label>
                <select id="subCategoryId" className={selectClass} {...form.register("subCategoryId")}>
                  <option value="">Select sub category</option>
                  {subCategories.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unitId">Unit *</Label>
                <select id="unitId" className={selectClass} {...form.register("unitId")}>
                  <option value="">Select unit</option>
                  {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                </select>
                {form.formState.errors.unitId && <p className="text-xs text-red-600">{form.formState.errors.unitId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mil">MIL Number</Label>
                <Input id="mil" {...form.register("mil")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hsn">HSN Code</Label>
                <Input id="hsn" placeholder="e.g. 73084000" {...form.register("hsn")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gst">GST %</Label>
                <Input id="gst" type="number" min="0" max="100" step="0.01" placeholder="e.g. 18" {...form.register("gst")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} {...form.register("description")} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => handleDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98] transition-all">
                {form.formState.isSubmitting ? "Saving..." : editingItem ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
