"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, ArrowLeft, Save, Eye } from "lucide-react";
import { QuickCreateSelect } from "@/components/ui/quick-create-select";
import { QuickCreateProductSelect } from "@/components/ui/quick-create-product-select";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  hsn?: string;
  gst?: number;
  unitId?: number;
}

interface PurchaseItem {
  productId: number;
  hsn: string;
  gst: number;
  unitId: number;
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
  receivingDate: string | null;
  supplier: { id: number; name: string };
}

interface PurchaseDetail {
  id: number;
  productId: number;
  hsn: string | null;
  gst: number | null;
  unitId: number | null;
  quantity: number;
  price: number;
  freight: number;
  total: number;
  product: { id: number; name: string };
  unit: { id: number; name: string } | null;
}

interface PurchaseFull extends PurchaseRow {
  details: PurchaseDetail[];
}

// ─── Default values ──────────────────────────────────────────────────────────

const emptyItem = (): PurchaseItem => ({
  productId: 0,
  hsn: "",
  gst: 0,
  unitId: 0,
  quantity: 0,
  price: 0,
  freight: 0,
  total: 0,
});

// ─── Component ───────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const [mode, setMode] = useState<"list" | "form" | "view">("list");
  const [viewingPurchase, setViewingPurchase] = useState<PurchaseFull | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Master data for dropdowns
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<{ id: number; name: string }[]>([]);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [supplierId, setSupplierId] = useState<number>(0);
  const [date, setDate] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transport, setTransport] = useState("");
  const [receivingDate, setReceivingDate] = useState("");
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
      const [suppRes, prodRes, unitRes] = await Promise.all([
        fetch("/api/masters/suppliers"),
        fetch("/api/masters/products"),
        fetch("/api/masters/units"),
      ]);
      if (suppRes.ok) setSuppliers(await suppRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (unitRes.ok) setUnits(await unitRes.json());
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
  const subTotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const freight = Number(item.freight) || 0;
    return sum + qty * price + freight;
  }, 0);
  const gstAmount = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const gstPct = Number(item.gst) || 0;
    return sum + qty * price * gstPct / 100;
  }, 0);
  const netAmount = subTotal + gstAmount; // same as grandTotal

  // ─── Line item helpers ────────────────────────────────────────────────────

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // When product changes, auto-fill hsn, gst, unitId
      if (field === "productId") {
        const prod = products.find((p) => p.id === Number(value));
        if (prod) {
          item.hsn = prod.hsn || "";
          item.gst = Number(prod.gst) || 0;
          item.unitId = prod.unitId || 0;
        }
      }

      // Recalculate total: (qty × price) × (1 + gst/100) + freight
      if (["quantity", "price", "freight", "gst", "productId"].includes(field as string)) {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const freight = Number(item.freight) || 0;
        const gst = Number(item.gst) || 0;
        item.total = Math.round((qty * price * (1 + gst / 100) + freight) * 10000) / 10000;
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
    setReceivingDate("");
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
      setReceivingDate(data.receivingDate ? data.receivingDate.substring(0, 10) : "");
      setItems(
        data.details.map((d: Record<string, unknown>) => ({
          productId: d.productId as number,
          hsn: (d.hsn as string) || "",
          gst: Number(d.gst) || 0,
          unitId: Number(d.unitId) || 0,
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

  const openViewForm = async (purchase: PurchaseRow) => {
    try {
      const res = await fetch(`/api/transactions/purchases/${purchase.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setViewingPurchase(data);
      setMode("view");
    } catch {
      toast.error("Failed to load purchase details");
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
        total: subTotal,
        gst: gstAmount,
        netAmount,
        vehicleNo,
        transport,
        receivingDate: receivingDate || null,
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
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="View" onClick={() => openViewForm(row.original)}>
            <Eye className="h-4 w-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditForm(row.original)}>
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

  // ─── Render: View ────────────────────────────────────────────────────────

  if (mode === "view" && viewingPurchase) {
    const p = viewingPurchase;
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { setViewingPurchase(null); setMode("list"); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Purchase — {p.invoiceNo}</h1>
          </div>
          <Button onClick={() => openEditForm(p)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>

        {/* Header */}
        <div className="rounded-md border p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            {[
              ["Invoice No", p.invoiceNo],
              ["Supplier", p.supplier?.name],
              ["Date", p.date ? new Date(p.date).toLocaleDateString("en-IN") : "-"],
              ["Receiving Date", p.receivingDate ? new Date(p.receivingDate).toLocaleDateString("en-IN") : "-"],
              ["Vehicle No", p.vehicleNo || "-"],
              ["Transport", p.transport || "-"],
            ].map(([label, value]) => (
              <div key={label} className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-md border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Purchase Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium w-10">#</th>
                  <th className="px-3 py-2 text-left font-medium">Product</th>
                  <th className="px-3 py-2 text-left font-medium">HSN</th>
                  <th className="px-3 py-2 text-right font-medium">GST %</th>
                  <th className="px-3 py-2 text-left font-medium">Unit</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 text-right font-medium">Price</th>
                  <th className="px-3 py-2 text-right font-medium">Freight</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {p.details.map((d, i) => (
                  <tr key={d.id} className="border-b">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2">{d.product?.name}</td>
                    <td className="px-3 py-2">{d.hsn || "-"}</td>
                    <td className="px-3 py-2 text-right">{Number(d.gst || 0).toFixed(2)}%</td>
                    <td className="px-3 py-2">{d.unit?.name ?? '-'}</td>
                    <td className="px-3 py-2 text-right">{Number(d.quantity).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2 text-right">{Number(d.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right">{Number(d.freight).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right font-medium">{Number(d.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-md border p-4">
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-3 text-sm">
              {[
                ["Sub Total", Number(p.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
                ["GST", Number(p.gst).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="font-medium">{label}:</span>
                  <span>{value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-3 text-base font-bold">
                <span>Net Amount:</span>
                <span>{Number(p.netAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <QuickCreateSelect
              label="Supplier"
              value={supplierId}
              onChange={setSupplierId}
              options={suppliers}
              onAdd={(item) => setSuppliers((prev) => [...prev, item])}
              createUrl="/api/masters/suppliers"
              placeholder="Select Supplier"
            />
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

          <div className="space-y-2">
            <Label htmlFor="receivingDate">Receiving Date</Label>
            <Input
              id="receivingDate"
              type="date"
              value={receivingDate}
              onChange={(e) => setReceivingDate(e.target.value)}
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
                <th className="px-3 py-2 text-left font-medium w-[100px]">HSN</th>
                <th className="px-3 py-2 text-right font-medium w-[80px]">GST %</th>
                <th className="px-3 py-2 text-left font-medium w-[130px]">Unit</th>
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
                    <QuickCreateProductSelect
                      value={item.productId}
                      onChange={(id) => updateItem(index, "productId", id)}
                      options={products}
                      onAdd={(item) => setProducts((prev) => [...prev, item])}
                      compact
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
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.gst}
                      onChange={(e) => updateItem(index, "gst", Number(e.target.value))}
                      className="h-9 w-full text-right"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <select
                      value={item.unitId}
                      onChange={(e) => updateItem(index, "unitId", Number(e.target.value))}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    >
                      <option value={0}>-- Unit --</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
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
            {/* Sub Total (before GST) */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sub Total:</span>
              <span className="text-sm font-semibold">
                {subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            {/* GST - auto computed */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">GST:</span>
              <span className="text-sm font-semibold">
                {gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
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
