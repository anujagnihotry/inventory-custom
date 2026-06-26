"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Save, Trash2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuickCreateProductSelect } from "@/components/ui/quick-create-product-select";

interface Product { id: number; name: string; }

interface StockRow {
  id: number;
  productId: number;
  quantity: string;
  price: string;
  addedDate: string;
  product: { id: number; name: string };
}

export default function OpeningStockPage() {
  const [data, setData] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [productId, setProductId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [addedDate, setAddedDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/opening-stock");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { toast.error("Failed to load stock"); }
    finally { setLoading(false); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/masters/products");
      if (res.ok) setProducts(await res.json());
    } catch { toast.error("Failed to load products"); }
  }, []);

  useEffect(() => { fetchData(); fetchProducts(); }, [fetchData, fetchProducts]);

  const resetForm = () => {
    setEditingId(null);
    setProductId(0);
    setQuantity("");
    setPrice("");
    setAddedDate(new Date().toISOString().split("T")[0]);
  };

  const openEdit = (row: StockRow) => {
    setEditingId(row.id);
    setProductId(row.productId);
    setQuantity(Number(row.quantity));
    setPrice(Number(row.price));
    setAddedDate(row.addedDate ? row.addedDate.substring(0, 10) : new Date().toISOString().split("T")[0]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!productId || !quantity || !price || !addedDate) {
      toast.error("All fields are required"); return;
    }
    try {
      setSaving(true);
      const url = editingId
        ? `/api/transactions/opening-stock/${editingId}`
        : "/api/transactions/opening-stock";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, price, addedDate, transactionId: 0 }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");

      toast.success(editingId ? "Stock entry updated" : "Stock entry added");
      resetForm();
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this stock entry?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/opening-stock/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete");
      toast.success("Stock entry deleted");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally { setDeleting(null); }
  };

  const columns: ColumnDef<StockRow>[] = [
    {
      accessorKey: "addedDate", header: "Date",
      cell: ({ row }) => row.original.addedDate ? new Date(row.original.addedDate).toLocaleDateString("en-IN") : "",
    },
    { accessorFn: (row) => row.product?.name, id: "productName", header: "Product" },
    {
      accessorKey: "quantity", header: "Quantity",
      cell: ({ row }) => Number(row.original.quantity).toLocaleString("en-IN"),
    },
    {
      accessorKey: "price", header: "Price",
      cell: ({ row }) => Number(row.original.price).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(row.original)} className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon" title="Delete"
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
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Opening Stock"
        description="Initial stock quantities loaded at system start."
        action={
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 active:scale-[0.98] transition-all">
            <Plus className="mr-1.5 h-4 w-4" /> Add Stock
          </Button>
        }
      />

      {loading ? <SkeletonTable rows={6} cols={4} /> : (
        <DataTable columns={columns} data={data} searchKey="productName" searchPlaceholder="Search by product..." />
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Stock Entry" : "Add Stock"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Product *</Label>
              <QuickCreateProductSelect
                options={products}
                value={productId}
                onChange={(val) => setProductId(Number(val))}
                onAdd={(item) => setProducts((prev) => [...prev, item])}
                disabled={!!editingId}
              />
              {editingId && <p className="text-xs text-muted-foreground">Product cannot be changed when editing.</p>}
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input type="number" value={quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : "")} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Price *</Label>
              <Input type="number" value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={addedDate} onChange={(e) => setAddedDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 text-white active:scale-[0.98] transition-all">
                <Save className="mr-1.5 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
