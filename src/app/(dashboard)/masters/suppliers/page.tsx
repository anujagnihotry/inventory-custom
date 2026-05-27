"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2 } from "lucide-react";

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  pincode: z.string().optional(),
  phoneNo: z.string().optional(),
  gst: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface Supplier {
  id: string;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  pincode?: string;
  phoneNo?: string;
  gst?: string;
  createdAt: string;
  updatedAt: string;
}

const defaultValues: SupplierFormData = {
  name: "",
  address: "",
  city: "",
  province: "",
  pincode: "",
  phoneNo: "",
  gst: "",
};

export default function SuppliersPage() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/masters/suppliers");
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (values: SupplierFormData) => {
    try {
      const url = editingItem
        ? `/api/masters/suppliers/${editingItem.id}`
        : "/api/masters/suppliers";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Failed to save supplier");

      toast.success(editingItem ? "Supplier updated" : "Supplier created");
      setDialogOpen(false);
      setEditingItem(null);
      form.reset(defaultValues);
      fetchData();
    } catch (error) {
      toast.error("Failed to save supplier");
    }
  };

  const handleEdit = (item: Supplier) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      address: item.address || "",
      city: item.city || "",
      province: item.province || "",
      pincode: item.pincode || "",
      phoneNo: item.phoneNo || "",
      gst: item.gst || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/masters/suppliers/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete supplier");
      toast.success("Supplier deleted");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete supplier");
    } finally {
      setDeleting(null);
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingItem(null);
      form.reset(defaultValues);
    }
  };

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "city",
      header: "City",
    },
    {
      accessorKey: "province",
      header: "Province",
    },
    {
      accessorKey: "phoneNo",
      header: "Phone",
    },
    {
      accessorKey: "gst",
      header: "GST",
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
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Supplier" : "Add Supplier"}
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
                  <Label htmlFor="phoneNo">Phone No</Label>
                  <Input id="phoneNo" {...form.register("phoneNo")} />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" {...form.register("address")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...form.register("city")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input id="province" {...form.register("province")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" {...form.register("pincode")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gst">GST</Label>
                  <Input id="gst" {...form.register("gst")} />
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
