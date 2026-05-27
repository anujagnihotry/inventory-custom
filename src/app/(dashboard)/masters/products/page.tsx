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
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  categoryId: string;
  subCategoryId?: string;
  unitId: string;
  description?: string;
  isConsumable?: boolean;
  mil?: string;
  item?: string;
  itemCode?: string;
  category?: { id: string; name: string };
  subCategory?: { id: string; name: string };
  unit?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface SelectOption {
  id: string;
  name: string;
}

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
    defaultValues: {
      name: "",
      categoryId: "",
      subCategoryId: "",
      unitId: "",
      description: "",
      mil: "",
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/masters/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [catRes, unitRes] = await Promise.all([
        fetch("/api/masters/categories"),
        fetch("/api/masters/units"),
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (unitRes.ok) setUnits(await unitRes.json());
    } catch (error) {
      toast.error("Failed to load dropdown data");
    }
  };

  const fetchSubCategories = useCallback(async (categoryId: string) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }
    try {
      const res = await fetch(`/api/masters/subcategories?categoryId=${categoryId}`);
      if (res.ok) setSubCategories(await res.json());
      else setSubCategories([]);
    } catch {
      setSubCategories([]);
    }
  }, []);

  // Watch category changes to filter subcategories
  const selectedCategoryId = form.watch("categoryId");

  const [lastCategoryId, setLastCategoryId] = useState<string>("");

  useEffect(() => {
    fetchSubCategories(selectedCategoryId);
    // Clear subcategory selection when category changes (not on initial load)
    if (lastCategoryId && lastCategoryId !== selectedCategoryId) {
      form.setValue("subCategoryId", "");
    }
    setLastCategoryId(selectedCategoryId);
  }, [selectedCategoryId, fetchSubCategories]);

  useEffect(() => {
    fetchData();
    fetchDropdowns();
  }, []);

  const onSubmit = async (values: ProductFormData) => {
    try {
      const url = editingItem
        ? `/api/masters/products/${editingItem.id}`
        : "/api/masters/products";
      const method = editingItem ? "PUT" : "POST";

      const payload = {
        ...values,
        subCategoryId: values.subCategoryId || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save product");

      toast.success(editingItem ? "Product updated" : "Product created");
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
      fetchData();
    } catch (error) {
      toast.error("Failed to save product");
    }
  };

  const handleEdit = async (item: Product) => {
    setEditingItem(item);
    // Pre-load subcategories for this product's category
    if (item.categoryId) {
      await fetchSubCategories(String(item.categoryId));
    }
    form.reset({
      name: item.name,
      categoryId: String(item.categoryId),
      subCategoryId: item.subCategoryId ? String(item.subCategoryId) : "",
      unitId: String(item.unitId),
      description: item.description || "",
      mil: item.mil || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/masters/products/${id}`, {
        method: "DELETE",
      });
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
    if (!open) {
      setEditingItem(null);
      setLastCategoryId("");
      setSubCategories([]);
      form.reset({
        name: "",
        categoryId: "",
        subCategoryId: "",
        unitId: "",
        description: "",
        mil: "",
      });
    }
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "category.name",
      header: "Category",
    },
    {
      accessorKey: "subCategory.name",
      header: "Sub Category",
    },
    {
      accessorKey: "unit.name",
      header: "Unit",
    },
    {
      accessorKey: "itemCode",
      header: "Item Code",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
            disabled={deleting === row.original.id}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Product" : "Add Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Item Code</Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {editingItem?.itemCode ?? "Auto-generated (e.g. SC0001)"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category *</Label>
                  <select
                    id="categoryId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...form.register("categoryId")}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.categoryId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.categoryId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subCategoryId">Sub Category</Label>
                  <select
                    id="subCategoryId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...form.register("subCategoryId")}
                  >
                    <option value="">Select sub category</option>
                    {subCategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitId">Unit *</Label>
                  <select
                    id="unitId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...form.register("unitId")}
                  >
                    <option value="">Select unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.unitId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.unitId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mil">MIL Number</Label>
                  <Input id="mil" {...form.register("mil")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  {...form.register("description")}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : editingItem
                      ? "Update"
                      : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
