"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, ArrowLeft, Save } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
}

interface PurchaseItem {
  productId: number;
  description: string;
  hsn: string;
  quantity: number;
  price: number;
  freight: number;
  total: number;
}

interface PurchaseRow {
  id: number;
  invoiceNo: string;
  supplierId: number;
  date: string;
  total: number;
  gst: number;
  netAmount: number;
  vehicleNo: string | null;
  transport: string | null;
  supplier: { id: number; name: string };
}

// ─── Default values ──────────────────────────────────────────────────────────

const emptyItem = (): PurchaseItem => ({
  productId: 0,
  description: "",
  hsn: "",
  quantity: 0,
  price: 0,
  freight: 0,
  total: 0,
});

// ─── Component ───────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Master data for dropdowns
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [supplierId, setSupplierId] = useState<number>(0);
  const [date, setDate] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transport, setTransport] = useState("");
  const [gst, setGst] = useState<number>(0);
  const [items, setItems] = useState<PurchaseItem[]>([emptyItem()]);

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/purchases");
      if (!res.ok) throw new Error("Failed to fetch purchases");
      const json = await res.json();
      setPurchases(json);
    } catch {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMasterData = useCallback(async () => {
    try {
      const [suppRes, prodRes] = await Promise.all([
        fetch("/api/masters/suppliers"),
        fetch("/api/masters/products"),
      ]);
      if (suppRes.ok) setSuppliers(await suppRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch {
      toast.error("Failed to load master data");
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
    fetchMasterData();
  }, [fetchPurchases, fetchMasterData]);

  // ─── Computed totals ──────────────────────────────────────────────────────

  const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const netAmount = grandTotal + gst;

  // ─── Line item helpers ────────────────────────────────────────────────────

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Auto-calculate total when qty, price, or freight change
      if (field === "quantity" || field === "price" || field === "freight") {
        const qty = field === "quantity" ? Number(value) : item.quantity;
        const price = field === "price" ? Number(value) : item.price;
        const freight = field === "freight" ? Number(value) : item.freight;
        item.total = Math.round((qty * price + freight) * 10000) / 10000;
      }

      updated[index] = item;
      return updated;
    });
  };

  const addRow = () => setItems((prev) => [...prev, emptyItem()]);

  const removeRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Form reset / open ────────────────────────────────────────────────────

  const resetForm = () => {
    setEditingId(null);
    setInvoiceNo("");
    setSupplierId(0);
    setDate("");
    setVehicleNo("");
    setTransport("");
    setGst(0);
    setItems([emptyItem()]);
  };

  const openNewForm = () => {
    resetForm();
    setMode("form");
  };

  const openEditForm = async (purchase: PurchaseRow) => {
    try {
      const res = await fetch(`/api/transactions/purchases/${purchase.id}`);
      if (!res.ok) throw new Error("Failed to load purchase details");
      const data = await res.json();

      setEditingId(data.id);
      setInvoiceNo(data.invoiceNo);
      setSupplierId(data.supplierId);
      setDate(data.date ? data.date.substring(0, 10) : "");
      setVehicleNo(data.vehicleNo || "");
      setTransport(data.transport || "");
      setGst(Number(data.gst) || 0);
      setItems(
        data.details.map((d: Record<string, unknown>) => ({
          productId: d.productId as number,
          description: (d.description as string) || "",
          hsn: (d.hsn as string) || "",
          quantity: Number(d.quantity),
          price: Number(d.price),
          freight: Number(d.freight),
          total: Number(d.total),
        }))
      );
      setMode("form");
    } catch {
      toast.error("Failed to load purchase for editing");
    }
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!invoiceNo.trim()) {
      toast.error("Invoice No is required");
      return;
    }
    if (!supplierId) {
      toast.error("Supplier is required");
      return;
    }
    if (!date) {
      toast.error("Date is required");
      return;
    }
    const validItems = items.filter((i) => i.productId > 0);
    if (validItems.length === 0) {
      toast.error("At least one line item with a product is required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        invoiceNo,
        supplierId,
        date,
        total: grandTotal,
        gst,
        netAmount,
        vehicleNo,
        transport,
        details: validItems,
      };

      const url = editingId
        ? `/api/transactions/purchases/${editingId}`
        : "/api/transactions/purchases";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save purchase");

      toast.success(editingId ? "Purchase updated" : "Purchase created");
      resetForm();
      setMode("list");
      fetchPurchases();
    } catch {
      toast.error("Failed to save purchase");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this purchase?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/purchases/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete purchase");
      toast.success("Purchase deleted");
      fetchPurchases();
    } catch {
      toast.error("Failed to delete purchase");
    } finally {
      setDeleting(null);
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────

  const columns: ColumnDef<PurchaseRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const d = row.original.date;
        return d ? new Date(d).toLocaleDateString("en-IN") : "";
      },
    },
    {
      accessorKey: "invoiceNo",
      header: "Invoice No",
    },
    {
      accessorFn: (row) => row.supplier?.name,
      id: "supplierName",
      header: "Supplier",
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => Number(row.original.total).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    },
    {
      accessorKey: "gst",
      header: "GST",
      cell: ({ row }) => Number(row.original.gst).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    },
    {
      accessorKey: "netAmount",
      header: "Net Amount",
      cell: ({ row }) => Number(row.original.netAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditForm(row.original)}
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

  // ─── Render: List view ────────────────────────────────────────────────────

  if (mode === "list") {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Purchases</h1>
          <Button onClick={openNewForm}>
            <Plus className="mr-2 h-4 w-4" /> New Purchase
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={purchases} searchKey="invoiceNo" searchPlaceholder="Search by invoice no..." />
        )}
      </div>
    );
  }

  // ─── Render: Form view ────────────────────────────────────────────────────

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              resetForm();
              setMode("list");
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {editingId ? "Edit Purchase" : "New Purchase"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              setMode("list");
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

      {/* Header fields */}
      <div className="rounded-md border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNo">Invoice No *</Label>
            <Input
              id="invoiceNo"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="INV-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierId">Supplier *</Label>
            <select
              id="supplierId"
              value={supplierId}
              onChange={(e) => setSupplierId(Number(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={0}>-- Select Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleNo">Vehicle No</Label>
            <Input
              id="vehicleNo"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="MH12AB1234"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transport">Transport</Label>
            <Input
              id="transport"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              placeholder="Transport name"
            />
          </div>
        </div>
      </div>

      {/* Line items table */}
      <div className="rounded-md border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Purchase Details</h2>
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-1 h-4 w-4" /> Add Row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium w-10">#</th>
                <th className="px-3 py-2 text-left font-medium min-w-[200px]">Product *</th>
                <th className="px-3 py-2 text-left font-medium min-w-[150px]">Description</th>
                <th className="px-3 py-2 text-left font-medium w-[100px]">HSN</th>
                <th className="px-3 py-2 text-right font-medium w-[100px]">Quantity</th>
                <th className="px-3 py-2 text-right font-medium w-[120px]">Price</th>
                <th className="px-3 py-2 text-right font-medium w-[100px]">Freight</th>
                <th className="px-3 py-2 text-right font-medium w-[120px]">Total</th>
                <th className="px-3 py-2 text-center font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                  <td className="px-3 py-1">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, "productId", Number(e.target.value))}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    >
                      <option value={0}>-- Select --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      className="h-9"
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <Input
                      value={item.hsn}
                      onChange={(e) => updateItem(index, "hsn", e.target.value)}
                      className="h-9"
                      placeholder="HSN"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <Input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      className="h-9 text-right"
                      min={0}
                    />
                  </td>
                  <td className="px-3 py-1">
                    <Input
                      type="number"
                      value={item.price || ""}
                      onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                      className="h-9 text-right"
                      min={0}
                    />
                  </td>
                  <td className="px-3 py-1">
                    <Input
                      type="number"
                      value={item.freight || ""}
                      onChange={(e) => updateItem(index, "freight", Number(e.target.value))}
                      className="h-9 text-right"
                      min={0}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {item.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeRow(index)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals section */}
      <div className="rounded-md border p-4">
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sub Total:</span>
              <span className="text-sm font-semibold">
                {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="gst" className="text-sm font-medium whitespace-nowrap">
                GST:
              </Label>
              <Input
                id="gst"
                type="number"
                value={gst || ""}
                onChange={(e) => setGst(Number(e.target.value))}
                className="h-9 w-[150px] text-right"
                min={0}
              />
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-base font-bold">Net Amount:</span>
              <span className="text-base font-bold">
                {netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
