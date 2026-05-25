"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";

interface AccessRight {
  id: number;
  userId: number;
  formId: number;
  canEdit: boolean;
  canSave: boolean;
  user: { id: number; name: string; username: string };
  form: { id: number; name: string };
}

interface UserOption {
  id: number;
  name: string;
  username: string;
}

interface FormOption {
  id: number;
  name: string;
}

interface FormState {
  userId: string;
  formId: string;
  canEdit: boolean;
  canSave: boolean;
}

const defaultForm: FormState = {
  userId: "",
  formId: "",
  canEdit: false,
  canSave: false,
};

export default function AccessRightsPage() {
  const [data, setData] = useState<AccessRight[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [forms, setForms] = useState<FormOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>(defaultForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/access-rights");
      if (!res.ok) throw new Error("Failed to fetch access rights");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load access rights");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [usersRes, formsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/masters/forms"),
      ]);
      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        setUsers(usersJson);
      }
      if (formsRes.ok) {
        const formsJson = await formsRes.json();
        setForms(formsJson);
      }
    } catch {
      // silently handle - dropdowns will be empty
    }
  };

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.userId || !formState.formId) {
      toast.error("User and Form are required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/access-rights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(formState.userId),
          formId: Number(formState.formId),
          canEdit: formState.canEdit,
          canSave: formState.canSave,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save access right");
      }

      toast.success("Access right saved");
      setDialogOpen(false);
      setFormState(defaultForm);
      fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save access right"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this access right?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/admin/access-rights/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete access right");
      toast.success("Access right deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete access right");
    } finally {
      setDeleting(null);
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setFormState(defaultForm);
    }
  };

  const columns: ColumnDef<AccessRight>[] = [
    {
      accessorKey: "user.name",
      header: "User",
      cell: ({ row }) => row.original.user.name,
    },
    {
      accessorKey: "form.name",
      header: "Form",
      cell: ({ row }) => row.original.form.name,
    },
    {
      accessorKey: "canEdit",
      header: "Can Edit",
      cell: ({ row }) => (row.original.canEdit ? "Yes" : "No"),
    },
    {
      accessorKey: "canSave",
      header: "Can Save",
      cell: ({ row }) => (row.original.canSave ? "Yes" : "No"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
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
        <h1 className="text-2xl font-bold">Access Rights</h1>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Access Right
          </Button>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Access Right</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User *</Label>
                <select
                  id="userId"
                  value={formState.userId}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, userId: e.target.value }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select User</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formId">Form *</Label>
                <select
                  id="formId"
                  value={formState.formId}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, formId: e.target.value }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select Form</option>
                  {forms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="canEdit"
                    checked={formState.canEdit}
                    onCheckedChange={(checked: boolean) =>
                      setFormState((s) => ({ ...s, canEdit: checked }))
                    }
                  />
                  <Label htmlFor="canEdit">Can Edit</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="canSave"
                    checked={formState.canSave}
                    onCheckedChange={(checked: boolean) =>
                      setFormState((s) => ({ ...s, canSave: checked }))
                    }
                  />
                  <Label htmlFor="canSave">Can Save</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
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
