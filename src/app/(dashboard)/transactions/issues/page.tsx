"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, ArrowLeft, Save, Pencil, Eye } from "lucide-react";
import { QuickCreateSelect } from "@/components/ui/quick-create-select";
import { QuickCreateProductSelect } from "@/components/ui/quick-create-product-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Buyer { id: number; name: string; }
interface Consignee { id: number; name: string; }
interface Product { id: number; name: string; hsn?: string; gst?: number; }

interface IssueDetailLine {
  productId: number | "";
  availableQty: number;
  hsn: string;
  gst: number;
  quantity: number | "";
  price: number | "";
  freight: number | "";
  total: number;
  issuePrice: number | "";
}

interface IssueDetailRecord {
  id: number;
  productId: number;
  hsn: string | null;
  gst: string;
  quantity: string;
  price: string;
  freight: string;
  total: string;
  issuePrice: string;
  product: { id: number; name: string };
}

interface Issue {
  id: number;
  date: string;
  consigneeId: number;
  buyerId: number;
  total: string;
  vehicleNo: string | null;
  transport: string | null;
  freight: string;
  remark: string | null;
  jobNo: string | null;
  createdAt: string;
  buyer: { id: number; name: string };
  consignee: { id: number; name: string };
  details?: IssueDetailRecord[];
}

const emptyDetail: IssueDetailLine = {
  productId: "", availableQty: 0, hsn: "", gst: 0,
  quantity: "", price: "", freight: "", total: 0, issuePrice: "",
};

export default function IssuesPage() {
  const [mode, setMode] = useState<"list" | "new" | "edit" | "view">("list");
  const [data, setData] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [consignees, setConsignees] = useState<Consignee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [consigneeId, setConsigneeId] = useState<number | "">("");
  const [buyerId, setBuyerId] = useState<number | "">("");
  const [jobNo, setJobNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transport, setTransport] = useState("");
  const [freight, setFreight] = useState<number | "">("");
  const [remark, setRemark] = useState("");
  const [details, setDetails] = useState<IssueDetailLine[]>([{ ...emptyDetail }]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/issues");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { toast.error("Failed to load issues"); }
    finally { setLoading(false); }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [br, cr, pr] = await Promise.all([
        fetch("/api/masters/buyers"),
        fetch("/api/masters/consignees"),
        fetch("/api/masters/products"),
      ]);
      if (br.ok) setBuyers(await br.json());
      if (cr.ok) setConsignees(await cr.json());
      if (pr.ok) setProducts(await pr.json());
    } catch { toast.error("Failed to load dropdown data"); }
  }, []);

  useEffect(() => { fetchData(); fetchDropdowns(); }, [fetchData, fetchDropdowns]);

  const resetForm = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split("T")[0]);
    setConsigneeId(""); setBuyerId(""); setJobNo("");
    setVehicleNo(""); setTransport(""); setFreight(""); setRemark("");
    setDetails([{ ...emptyDetail }]);
  };

  const fetchStockForProduct = async (productId: number) => {
    try {
      const res = await fetch(`/api/transactions/stock/product/${productId}`);
      if (!res.ok) return { totalQty: 0, avgPrice: 0 };
      return await res.json();
    } catch { return { totalQty: 0, avgPrice: 0 }; }
  };

  const handleProductChange = async (index: number, productId: number) => {
    const newDetails = [...details];
    newDetails[index].productId = productId;
    if (productId) {
      const stock = await fetchStockForProduct(productId);
      newDetails[index].availableQty = stock.totalQty;
      newDetails[index].price = parseFloat(stock.avgPrice.toFixed(2));
      newDetails[index].issuePrice = parseFloat(stock.avgPrice.toFixed(2));
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        newDetails[index].hsn = prod.hsn || "";
        newDetails[index].gst = Number(prod.gst) || 0;
      }
    } else {
      newDetails[index].availableQty = 0;
      newDetails[index].price = "";
      newDetails[index].issuePrice = "";
      newDetails[index].hsn = "";
      newDetails[index].gst = 0;
    }
    recalcLineTotal(newDetails, index);
    setDetails(newDetails);
  };

  const handleDetailChange = (index: number, field: keyof IssueDetailLine, value: string | number) => {
    const newDetails = [...details];
    (newDetails[index] as unknown as Record<string, unknown>)[field] = value;
    recalcLineTotal(newDetails, index);
    setDetails(newDetails);
  };

  const recalcLineTotal = (lines: IssueDetailLine[], index: number) => {
    const line = lines[index];
    const qty = Number(line.quantity) || 0;
    const price = Number(line.price) || 0;
    const freight = Number(line.freight) || 0;
    const gstPct = Number(line.gst) || 0;
    lines[index].total = parseFloat(
      (qty * price * (1 + gstPct / 100) + freight).toFixed(2)
    );
  };

  const grandTotal = details.reduce((sum, d) => sum + (d.total || 0), 0);
  const subTotal = details.reduce((sum, d) => {
    const qty = Number(d.quantity) || 0;
    const price = Number(d.price) || 0;
    const freight = Number(d.freight) || 0;
    return sum + qty * price + freight;
  }, 0);
  const gstTotal = grandTotal - subTotal;

  const handleView = async (id: number) => {
    try {
      const res = await fetch(`/api/transactions/issues/${id}`);
      if (!res.ok) throw new Error();
      const issue = await res.json();
      setViewingIssue(issue);
      setMode("view");
    } catch { toast.error("Failed to load issue"); }
  };

  const handleEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/transactions/issues/${id}`);
      if (!res.ok) throw new Error();
      const issue: Issue = await res.json();
      setEditingId(id);
      setDate(issue.date.split("T")[0]);
      setConsigneeId(issue.consigneeId);
      setBuyerId(issue.buyerId);
      setJobNo(issue.jobNo || "");
      setVehicleNo(issue.vehicleNo || "");
      setTransport(issue.transport || "");
      setFreight(issue.freight ? parseFloat(issue.freight) : "");
      setRemark(issue.remark || "");

      if (issue.details && issue.details.length > 0) {
        const lines: IssueDetailLine[] = await Promise.all(
          issue.details.map(async (d) => {
            const stock = await fetchStockForProduct(d.productId);
            return {
              productId: d.productId,
              availableQty: stock.totalQty,
              hsn: d.hsn || "",
              gst: Number(d.gst) || 0,
              quantity: parseFloat(d.quantity),
              price: parseFloat(d.price),
              freight: parseFloat(d.freight),
              total: parseFloat(d.total),
              issuePrice: parseFloat(d.issuePrice),
            };
          })
        );
        setDetails(lines);
      } else {
        setDetails([{ ...emptyDetail }]);
      }
      setMode("edit");
    } catch { toast.error("Failed to load issue for editing"); }
  };

  const handleSave = async () => {
    if (!consigneeId || !buyerId) {
      toast.error("Please select consignee and buyer"); return;
    }
    const validDetails = details.filter((d) => d.productId && d.quantity);
    if (validDetails.length === 0) {
      toast.error("Please add at least one line item"); return;
    }

    try {
      setSaving(true);
      const url = editingId ? `/api/transactions/issues/${editingId}` : "/api/transactions/issues";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, consigneeId, buyerId, total: grandTotal.toFixed(2),
          vehicleNo, transport, freight: freight || 0, remark, jobNo,
          details: validDetails.map((d) => ({
            productId: d.productId, quantity: d.quantity,
            price: d.price || 0, freight: d.freight || 0,
            total: d.total, issuePrice: d.issuePrice || 0,
            hsn: d.hsn || null, gst: d.gst || 0,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.locked) { setLockMessage(err.error); return; }
        throw new Error(err.error || "Failed to save issue");
      }

      toast.success(editingId ? "Issue updated successfully" : "Issue created successfully");
      resetForm();
      setMode("list");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save issue");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/issues/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        if (err.locked) { setLockMessage(err.error); return; }
        throw new Error(err.error || "Failed to delete issue");
      }
      toast.success("Issue deleted");
      fetchData();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to delete issue"); }
    finally { setDeleting(null); }
  };

  const columns: ColumnDef<Issue>[] = [
    { accessorKey: "id", header: "ID" },
    {
      accessorKey: "date", header: "Date",
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
    },
    {
      accessorKey: "buyer.name", header: "Buyer",
      cell: ({ row }) => row.original.buyer?.name || "-",
    },
    {
      accessorKey: "consignee.name", header: "Consignee",
      cell: ({ row }) => row.original.consignee?.name || "-",
    },
    { accessorKey: "jobNo", header: "Job No" },
    {
      accessorKey: "total", header: "Total",
      cell: ({ row }) => parseFloat(row.original.total).toFixed(2),
    },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleView(row.original.id)} title="View">
            <Eye className="h-4 w-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original.id)} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={() => handleDelete(row.original.id)}
            disabled={deleting === row.original.id}
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  // ── VIEW MODE ──────────────────────────────────────────────
  if (mode === "view" && viewingIssue) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => { setViewingIssue(null); setMode("list"); }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Issue #{viewingIssue.id}</h1>
          </div>
          <Button onClick={() => handleEdit(viewingIssue.id)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold">Issue Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              ["Date", new Date(viewingIssue.date).toLocaleDateString()],
              ["Buyer", viewingIssue.buyer?.name],
              ["Consignee", viewingIssue.consignee?.name],
              ["Job No", viewingIssue.jobNo || "-"],
              ["Vehicle No", viewingIssue.vehicleNo || "-"],
              ["Transport", viewingIssue.transport || "-"],
              ["Freight", viewingIssue.freight || "0"],
              ["Remark", viewingIssue.remark || "-"],
            ].map(([label, value]) => (
              <div key={label} className="space-y-1">
                <p className="text-muted-foreground font-medium">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold">Line Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">HSN</th>
                  <th className="text-right p-2">GST %</th>
                  <th className="text-right p-2">Qty</th>
                  <th className="text-right p-2">Price</th>
                  <th className="text-right p-2">Freight</th>
                  <th className="text-right p-2">Total</th>
                  <th className="text-right p-2">Issue Price</th>
                </tr>
              </thead>
              <tbody>
                {viewingIssue.details?.map((d, i) => (
                  <tr key={d.id} className="border-b">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2">{d.product?.name}</td>
                    <td className="p-2">{d.hsn || "-"}</td>
                    <td className="p-2 text-right">{Number(d.gst || 0).toFixed(2)}%</td>
                    <td className="p-2 text-right">{parseFloat(d.quantity).toFixed(2)}</td>
                    <td className="p-2 text-right">{parseFloat(d.price).toFixed(2)}</td>
                    <td className="p-2 text-right">{parseFloat(d.freight).toFixed(2)}</td>
                    <td className="p-2 text-right">{parseFloat(d.total).toFixed(2)}</td>
                    <td className="p-2 text-right">{parseFloat(d.issuePrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <div className="space-y-1 text-sm text-right">
              <div className="flex justify-between gap-12">
                <span className="text-muted-foreground">Grand Total:</span>
                <span className="font-bold text-base">{parseFloat(viewingIssue.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM MODE (new / edit) ─────────────────────────────────
  if (mode === "new" || mode === "edit") {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => { resetForm(); setMode("list"); }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              {mode === "edit" ? `Edit Issue #${editingId}` : "New Issue"}
            </h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold">Issue Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Consignee *</Label>
              <QuickCreateSelect
                label="Consignee"
                value={consigneeId}
                onChange={setConsigneeId}
                options={consignees}
                onAdd={(item) => setConsignees((prev) => [...prev, item])}
                createUrl="/api/masters/consignees"
              />
            </div>
            <div className="space-y-2">
              <Label>Buyer *</Label>
              <QuickCreateSelect
                label="Buyer"
                value={buyerId}
                onChange={setBuyerId}
                options={buyers}
                onAdd={(item) => setBuyers((prev) => [...prev, item])}
                createUrl="/api/masters/buyers"
              />
            </div>
            <div className="space-y-2">
              <Label>Job No</Label>
              <Input value={jobNo} onChange={(e) => setJobNo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vehicle No</Label>
              <Input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Transport</Label>
              <Input value={transport} onChange={(e) => setTransport(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Freight</Label>
              <Input type="number" value={freight}
                onChange={(e) => setFreight(e.target.value ? parseFloat(e.target.value) : "")} />
            </div>
            <div className="space-y-2">
              <Label>Remark</Label>
              <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Line Items</h2>
            <Button variant="outline" size="sm" onClick={() => setDetails([...details, { ...emptyDetail }])}>
              <Plus className="mr-2 h-4 w-4" /> Add Line
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 min-w-[200px]">Product</th>
                  <th className="text-left p-2 w-[90px]">HSN</th>
                  <th className="text-right p-2 w-[70px]">GST %</th>
                  <th className="text-left p-2 w-[90px]">Avail Qty</th>
                  <th className="text-left p-2 w-[90px]">Quantity</th>
                  <th className="text-left p-2 w-[90px]">Price</th>
                  <th className="text-left p-2 w-[90px]">Freight</th>
                  <th className="text-left p-2 w-[90px]">Total</th>
                  <th className="text-left p-2 w-[90px]">Issue Price</th>
                  <th className="p-2 w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                {details.map((line, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">
                      <QuickCreateProductSelect
                        value={line.productId}
                        onChange={(id) => handleProductChange(index, id)}
                        options={products}
                        onAdd={(item) => setProducts((prev) => [...prev, item])}
                        compact
                      />
                    </td>
                    <td className="p-2">
                      <Input value={line.hsn} className="h-9"
                        onChange={(e) => handleDetailChange(index, "hsn", e.target.value)}
                        placeholder="HSN" />
                    </td>
                    <td className="p-2">
                      <Input type="number" value={line.gst} className="h-9 text-right"
                        min={0} max={100} step={0.01}
                        onChange={(e) => handleDetailChange(index, "gst", e.target.value ? parseFloat(e.target.value) : 0)} />
                    </td>
                    <td className="p-2">
                      <Input type="number" value={line.availableQty} readOnly className="bg-muted h-9" />
                    </td>
                    <td className="p-2">
                      <Input type="number" value={line.quantity} className="h-9"
                        onChange={(e) => handleDetailChange(index, "quantity", e.target.value ? parseFloat(e.target.value) : "")} />
                    </td>
                    <td className="p-2">
                      <Input type="number" value={line.price} className="h-9"
                        onChange={(e) => handleDetailChange(index, "price", e.target.value ? parseFloat(e.target.value) : "")} />
                    </td>
                    <td className="p-2">
                      <Input type="number" value={line.freight} className="h-9"
                        onChange={(e) => handleDetailChange(index, "freight", e.target.value ? parseFloat(e.target.value) : "")} />
                    </td>
                    <td className="p-2">
                      <Input type="number" value={line.total} readOnly className="bg-muted h-9" />
                    </td>
                    <td className="p-2">
                      <Input type="number" value={line.issuePrice} className="h-9"
                        onChange={(e) => handleDetailChange(index, "issuePrice", e.target.value ? parseFloat(e.target.value) : "")} />
                    </td>
                    <td className="p-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9"
                        onClick={() => setDetails(details.filter((_, i) => i !== index))}
                        disabled={details.length <= 1}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="space-y-1 text-sm text-right min-w-[220px]">
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Sub Total:</span>
                <span>{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">GST:</span>
                <span>{gstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-8 text-base font-semibold border-t pt-1">
                <span>Grand Total:</span>
                <span>{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        <LockDialog message={lockMessage} onClose={() => setLockMessage(null)} />
      </div>
    );
  }

  // ── LIST MODE ──────────────────────────────────────────────
  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues</h1>
        <Button onClick={() => { resetForm(); setMode("new"); }}>
          <Plus className="mr-2 h-4 w-4" /> New Issue
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
      <LockDialog message={lockMessage} onClose={() => setLockMessage(null)} />
    </div>
  );
}

function LockDialog({ message, onClose }: { message: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!message} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Record Locked</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{message}</p>
        <DialogFooter>
          <Button onClick={onClose}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
