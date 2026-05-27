"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Save, Trash2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" title="Delete"
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
        <h1 className="text-2xl font-bold">Stock</h1>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Stock
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Stock Entry" : "Add Stock"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Product *</Label>
              <select
                value={productId}
                onChange={(e) => setProductId(Number(e.target.value))}
                disabled={!!editingId} // can't change product on edit
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value={0}>-- Select Product --</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
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
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
