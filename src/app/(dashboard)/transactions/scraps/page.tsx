"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuickCreateSelect } from "@/components/ui/quick-create-select";
import { QuickCreateProductSelect } from "@/components/ui/quick-create-product-select";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Buyer {
  id: number;
  name: string;
}
interface Product {
  id: number;
  name: string;
}

interface ScrapRow {
  id: number;
  buyerId: number;
  jobNo: string | null;
  productId: number;
  quantity: string;
  price: string;
  date: string;
  buyer: { id: number; name: string };
  product: { id: number; name: string };
}

export default function ScrapsPage() {
  const [data, setData] = useState<ScrapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [buyerId, setBuyerId] = useState<number | "">("");
  const [productId, setProductId] = useState<number | "">("");
  const [jobNo, setJobNo] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/scraps");
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      toast.error("Failed to load scraps");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [bRes, pRes] = await Promise.all([
        fetch("/api/masters/buyers"),
        fetch("/api/masters/products"),
      ]);
      if (bRes.ok) setBuyers(await bRes.json());
      if (pRes.ok) setProducts(await pRes.json());
    } catch {
      toast.error("Failed to load dropdown data");
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchDropdowns();
  }, [fetchData, fetchDropdowns]);

  const resetForm = () => {
    setBuyerId("");
    setProductId("");
    setJobNo("");
    setQuantity("");
    setPrice("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleSave = async () => {
    if (!buyerId || !productId || !quantity || !price || !date) {
      toast.error("Buyer, product, quantity, price, and date are required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/transactions/scraps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId,
          jobNo,
          productId,
          quantity,
          price,
          date,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Scrap recorded");
      resetForm();
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to save scrap");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<ScrapRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.date).toLocaleDateString("en-IN"),
    },
    {
      accessorFn: (row) => row.buyer?.name,
      id: "buyerName",
      header: "Buyer",
    },
    {
      accessorFn: (row) => row.product?.name,
      id: "productName",
      header: "Product",
    },
    {
      accessorKey: "jobNo",
      header: "Job No",
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => Number(row.original.quantity).toLocaleString("en-IN"),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) =>
        Number(row.original.price).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        }),
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scraps</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Scrap
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Scrap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <QuickCreateSelect
                label="Buyer"
                createUrl="/api/masters/buyers"
                options={buyers}
                value={buyerId}
                onChange={(id) => setBuyerId(id)}
                onAdd={(item) => setBuyers((prev) => [...prev, item])}
              />
            </div>
            <div className="space-y-2">
              <QuickCreateProductSelect
                compact
                options={products}
                value={productId}
                onChange={(id) => setProductId(id)}
                onAdd={(item) => setProducts((prev) => [...prev, item])}
              />
            </div>
            <div className="space-y-2">
              <Label>Job No</Label>
              <Input
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value ? Number(e.target.value) : "")
                  }
                  min={0}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setDialogOpen(false);
                }}
              >
                Cancel
              </Button>
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
