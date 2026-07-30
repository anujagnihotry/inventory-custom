"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

const expenseTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  includeInSiteEvaluation: z.boolean(),
});

type ExpenseTypeFormData = z.infer<typeof expenseTypeSchema>;

interface ExpenseType {
  id: string;
  name: string;
  includeInSiteEvaluation: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ExpenseTypesPage() {
  const [data, setData] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseType | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const form = useForm<ExpenseTypeFormData>({
    resolver: zodResolver(expenseTypeSchema),
    defaultValues: { name: "", includeInSiteEvaluation: false },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/masters/expense-types");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error("Failed to load expense types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (values: ExpenseTypeFormData) => {
    try {
      const url = editingItem
        ? `/api/masters/expense-types/${editingItem.id}`
        : "/api/masters/expense-types";
      const res = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      toast.success(editingItem ? "Expense type updated" : "Expense type created");
      setDialogOpen(false);
      setEditingItem(null);
      form.reset({ name: "", includeInSiteEvaluation: false });
      fetchData();
    } catch {
      toast.error("Failed to save expense type");
    }
  };

  const handleEdit = (item: ExpenseType) => {
    setEditingItem(item);
    form.reset({ name: item.name, includeInSiteEvaluation: item.includeInSiteEvaluation });
    setDialogOpen(true);
  };

  const handleToggle = async (item: ExpenseType) => {
    try {
      setToggling(item.id);
      const res = await fetch(`/api/masters/expense-types/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          includeInSiteEvaluation: !item.includeInSiteEvaluation,
        }),
      });
      if (!res.ok) throw new Error();
      setData((prev) =>
        prev.map((d) =>
          d.id === item.id
            ? { ...d, includeInSiteEvaluation: !d.includeInSiteEvaluation }
            : d
        )
      );
    } catch {
      toast.error("Failed to update");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense type?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/masters/expense-types/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete expense type");
      toast.success("Expense type deleted");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete expense type");
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<ExpenseType>[] = [
    { accessorKey: "name", header: "Name" },
    {
      id: "siteEval",
      header: "Site Value Evaluation",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.original.includeInSiteEvaluation}
            disabled={toggling === row.original.id}
            onCheckedChange={() => handleToggle(row.original)}
          />
          <span className="text-xs text-muted-foreground">
            {row.original.includeInSiteEvaluation ? "Included" : "Excluded"}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon"
            onClick={() => handleEdit(row.original)}
            className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={() => handleDelete(row.original.id)}
            disabled={deleting === row.original.id}
            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Expense Types"
        description="Types used to classify miscellaneous expenses."
        action={
          <Button
            onClick={() => {
              setEditingItem(null);
              form.reset({ name: "", includeInSiteEvaluation: false });
              setDialogOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 active:scale-[0.98] transition-all"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Expense Type
          </Button>
        }
      />

      {loading
        ? <SkeletonTable rows={5} cols={3} />
        : <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Search expense types..." />
      }

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { setEditingItem(null); form.reset({ name: "", includeInSiteEvaluation: false }); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Expense Type" : "New Expense Type"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g. Transport" autoFocus />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Include in Site Value Evaluation</Label>
                <p className="text-xs text-muted-foreground">
                  Total amount for this category will be included in the site value report.
                </p>
              </div>
              <Switch
                checked={form.watch("includeInSiteEvaluation")}
                onCheckedChange={(v) => form.setValue("includeInSiteEvaluation", v)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98] transition-all"
              >
                {form.formState.isSubmitting ? "Saving..." : editingItem ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
