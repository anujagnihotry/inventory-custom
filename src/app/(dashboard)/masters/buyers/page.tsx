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

const buyerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  pincode: z.string().optional(),
  phoneNo: z.string().optional(),
  gst: z.string().optional(),
});

type BuyerFormData = z.infer<typeof buyerSchema>;

interface Buyer {
  id: string;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  pincode?: string;
  phoneNo?: string;
  gst?: string;
}

const defaultValues: BuyerFormData = { name: "", address: "", city: "", province: "", pincode: "", phoneNo: "", gst: "" };

const selectClass = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400";

export default function BuyersPage() {
  const [data, setData] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Buyer | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const form = useForm<BuyerFormData>({ resolver: zodResolver(buyerSchema), defaultValues });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/masters/buyers");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error("Failed to load buyers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (values: BuyerFormData) => {
    try {
      const url = editingItem ? `/api/masters/buyers/${editingItem.id}` : "/api/masters/buyers";
      const res = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      toast.success(editingItem ? "Buyer updated" : "Buyer created");
      setDialogOpen(false);
      setEditingItem(null);
      form.reset(defaultValues);
      fetchData();
    } catch {
      toast.error("Failed to save buyer");
    }
  };

  const handleEdit = (item: Buyer) => {
    setEditingItem(item);
    form.reset({ name: item.name, address: item.address || "", city: item.city || "", province: item.province || "", pincode: item.pincode || "", phoneNo: item.phoneNo || "", gst: item.gst || "" });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this buyer?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/masters/buyers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete buyer");
      toast.success("Buyer deleted");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete buyer");
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<Buyer>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "city", header: "City" },
    { accessorKey: "province", header: "Province" },
    { accessorKey: "phoneNo", header: "Phone" },
    { accessorKey: "gst", header: "GST" },
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
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Buyers"
        description="Companies or individuals who receive issued materials."
        action={
          <Button onClick={() => { setEditingItem(null); form.reset(defaultValues); setDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 active:scale-[0.98] transition-all">
            <Plus className="mr-1.5 h-4 w-4" /> Add Buyer
          </Button>
        }
      />

      {loading ? <SkeletonTable rows={5} cols={5} /> : <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Search buyers..." />}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingItem(null); form.reset(defaultValues); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Buyer" : "New Buyer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phoneNo">Phone No</Label>
                <Input id="phoneNo" {...form.register("phoneNo")} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...form.register("address")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...form.register("city")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="province">Province</Label>
                <Input id="province" {...form.register("province")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" {...form.register("pincode")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gst">GST</Label>
                <Input id="gst" {...form.register("gst")} />
              </div>
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
