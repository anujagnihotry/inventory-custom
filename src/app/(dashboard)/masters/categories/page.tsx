"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
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

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/masters/categories");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (values: CategoryFormData) => {
    try {
      const url = editingItem ? `/api/masters/categories/${editingItem.id}` : "/api/masters/categories";
      const res = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      toast.success(editingItem ? "Category updated" : "Category created");
      setDialogOpen(false);
      setEditingItem(null);
      form.reset({ name: "" });
      fetchData();
    } catch {
      toast.error("Failed to save category");
    }
  };

  const handleEdit = (item: Category) => {
    setEditingItem(item);
    form.reset({ name: item.name });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/masters/categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete category");
      toast.success("Category deleted");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category");
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<Category>[] = [
    { accessorKey: "name", header: "Name" },
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
        title="Categories"
        description="Organise products into top-level categories."
        action={
          <Button onClick={() => { setEditingItem(null); form.reset({ name: "" }); setDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 active:scale-[0.98] transition-all">
            <Plus className="mr-1.5 h-4 w-4" /> Add Category
          </Button>
        }
      />

      {loading ? <SkeletonTable rows={5} cols={2} /> : <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Search categories..." />}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingItem(null); form.reset({ name: "" }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g. Scaffolding" autoFocus />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
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
