"use client";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Category { id: number; name: string; }
interface SubCategory { id: number; name: string; categoryId: number; category: Category; }
interface FormValues { name: string; categoryId: string; }

export default function SubCategoriesPage() {
  const [data, setData] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const form = useForm<FormValues>({ defaultValues: { name: "", categoryId: "" } });

  const fetchData = useCallback(async () => {
    try {
      const [subCatRes, catRes] = await Promise.all([
        fetch("/api/masters/subcategories"),
        fetch("/api/masters/categories"),
      ]);
      if (subCatRes.ok) setData(await subCatRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDialogOpen = (open: boolean) => {
    if (!open) { setEditingItem(null); form.reset({ name: "", categoryId: "" }); }
    setDialogOpen(open);
  };

  const handleEdit = (item: SubCategory) => {
    setEditingItem(item);
    form.reset({ name: item.name, categoryId: String(item.categoryId) });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this sub-category?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/masters/subcategories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete sub-category");
      toast.success("Sub-category deleted");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete sub-category");
    } finally {
      setDeleting(null);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!values.name.trim()) { toast.error("Name is required"); return; }
    if (!values.categoryId) { toast.error("Category is required"); return; }
    setSubmitting(true);
    try {
      const url = editingItem ? `/api/masters/subcategories/${editingItem.id}` : "/api/masters/subcategories";
      const res = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name.trim(), categoryId: values.categoryId }),
      });
      if (res.ok) {
        toast.success(editingItem ? "Sub-category updated" : "Sub-category created");
        handleDialogOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<SubCategory>[] = [
    { accessorKey: "name", header: "Sub-Category Name" },
    { accessorKey: "category.name", header: "Category", cell: ({ row }) => row.original.category?.name ?? "-" },
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
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Sub-Categories"
        description="Second-level grouping within a category."
        action={
          <Button onClick={() => { setEditingItem(null); form.reset({ name: "", categoryId: "" }); setDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 active:scale-[0.98] transition-all">
            <Plus className="mr-1.5 h-4 w-4" /> Add Sub-Category
          </Button>
        }
      />

      {loading ? <SkeletonTable rows={5} cols={3} /> : <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Search sub-categories..." />}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Sub-Category" : "New Sub-Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="categoryId">Category *</Label>
              <select id="categoryId" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" {...form.register("categoryId")}>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Sub-Category Name *</Label>
              <Input id="name" placeholder="Enter name" {...form.register("name")} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => handleDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98] transition-all">
                {submitting ? "Saving..." : editingItem ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
