"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, ArrowLeft, Save, Search } from "lucide-react";
import { QuickCreateSelect } from "@/components/ui/quick-create-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Buyer { id: number; name: string; }
interface Unit { id: number; name: string; }

interface ReturnDetailLine {
  checked: boolean;
  productId: number | "";
  productName: string;
  unitId: number | "";
  hsn: string;
  gst: number;
  maxReturnQty: number;      // remaining returnable qty (0 = no limit / manual row)
  returnQuantity: number | "";
  issuePrice: number | "";
  returnPrice: number | "";
  freight: number | "";
  issueDetailId: number | null;
  issueId: number | null;
}

interface ReturnRecord {
  id: number;
  invoiceNo: string | null;
  buyerId: number;
  vehicleNo: string | null;
  transport: string | null;
  freight: string;
  returnDate: string;
  total: string;
  jobNo: string | null;
  remark: string | null;
  createdAt: string;
  buyer: { id: number; name: string };
}

const emptyDetail = (): ReturnDetailLine => ({
  checked: true,
  productId: "",
  productName: "",
  unitId: "",
  hsn: "",
  gst: 0,
  maxReturnQty: 0,
  returnQuantity: "",
  issuePrice: "",
  returnPrice: "",
  freight: "",
  issueDetailId: null,
  issueId: null,
});

export default function ReturnsPage() {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [data, setData] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Form state
  const [invoiceNo, setInvoiceNo] = useState("");
  const [buyerId, setBuyerId] = useState<number | "">("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [jobNo, setJobNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transport, setTransport] = useState("");
  const [freight, setFreight] = useState<number | "">("");
  const [remark, setRemark] = useState("");
  const [details, setDetails] = useState<ReturnDetailLine[]>([emptyDetail()]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/returns");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { toast.error("Failed to load returns"); }
    finally { setLoading(false); }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [buyersRes, unitsRes] = await Promise.all([
        fetch("/api/masters/buyers"),
        fetch("/api/masters/units"),
      ]);
      if (buyersRes.ok) setBuyers(await buyersRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
    } catch { toast.error("Failed to load dropdown data"); }
  }, []);

  useEffect(() => {
    fetchData();
    fetchDropdowns();
  }, [fetchData, fetchDropdowns]);

  const resetForm = () => {
    setInvoiceNo("");
    setBuyerId("");
    setReturnDate(new Date().toISOString().split("T")[0]);
    setJobNo("");
    setVehicleNo("");
    setTransport("");
    setFreight("");
    setRemark("");
    setDetails([emptyDetail()]);
  };

  // Auto-populate line items from issues when buyer + jobNo are set
  const fetchReturnableItems = async () => {
    if (!buyerId || !jobNo.trim()) return;
    try {
      setLoadingItems(true);
      const res = await fetch(
        `/api/transactions/issues/returnable?buyerId=${buyerId}&jobNo=${encodeURIComponent(jobNo.trim())}`
      );
      if (!res.ok) return;
      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) {
        toast.info("No returnable items found for this buyer and job no.");
        return;
      }
      setDetails(
        items.map((item: {
          issueId: number; issueDetailId: number; productId: number; productName: string;
          unitId: number | null; hsn: string; gst: number; remaining: number; issuePrice: number;
        }) => ({
          checked: true,
          productId: item.productId,
          productName: item.productName,
          unitId: item.unitId ?? "",
          hsn: item.hsn,
          gst: item.gst,
          maxReturnQty: item.remaining,
          returnQuantity: item.remaining,
          issuePrice: item.issuePrice,
          returnPrice: item.issuePrice,
          freight: "",
          issueDetailId: item.issueDetailId,
          issueId: item.issueId,
        }))
      );
    } catch { toast.error("Failed to fetch returnable items"); }
    finally { setLoadingItems(false); }
  };

  const toggleCheck = (index: number) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], checked: !newDetails[index].checked };
    setDetails(newDetails);
  };

  const handleDetailChange = (index: number, field: keyof ReturnDetailLine, value: string | number | boolean) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const addDetailLine = () => setDetails([...details, emptyDetail()]);

  const removeDetailLine = (index: number) => {
    if (details.length <= 1) return;
    setDetails(details.filter((_, i) => i !== index));
  };

  const calculateLineTotal = (line: ReturnDetailLine) => {
    if (!line.checked) return 0;
    const qty = Number(line.returnQuantity) || 0;
    const price = Number(line.returnPrice) || 0;
    const lineFreight = Number(line.freight) || 0;
    return parseFloat((qty * price + lineFreight).toFixed(2));
  };

  const grandTotal = details.reduce((sum, d) => sum + calculateLineTotal(d), 0).toFixed(2);
  const roundOff = parseFloat((Math.round(parseFloat(grandTotal)) - parseFloat(grandTotal)).toFixed(2));

  const handleSave = async () => {
    if (!buyerId) { toast.error("Please select a buyer"); return; }

    const checkedDetails = details.filter((d) => d.checked && d.productId && d.returnQuantity);
    if (checkedDetails.length === 0) {
      toast.error("Please check at least one line item with a product and quantity");
      return;
    }

    // Validate max quantities
    const exceeded = checkedDetails.find(
      (d) => d.maxReturnQty > 0 && Number(d.returnQuantity) > d.maxReturnQty
    );
    if (exceeded) {
      toast.error(`Return quantity for "${exceeded.productName}" exceeds the issued quantity (max: ${exceeded.maxReturnQty})`);
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/transactions/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNo,
          buyerId,
          returnDate,
          total: grandTotal,
          roundOff: roundOff.toFixed(2),
          vehicleNo,
          transport,
          freight: freight || 0,
          jobNo,
          remark,
          details: checkedDetails.map((d) => ({
            productId: d.productId,
            unitId: d.unitId || null,
            returnQuantity: d.returnQuantity,
            issuePrice: d.issuePrice || 0,
            returnPrice: d.returnPrice || 0,
            freight: d.freight || 0,
            issueDetailId: d.issueDetailId,
            issueId: d.issueId,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.locked) { setLockMessage(err.error); return; }
        throw new Error(err.error || "Failed to save return");
      }

      toast.success("Return created successfully");
      resetForm();
      setMode("list");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save return");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this return?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/returns/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        if (err.locked) { setLockMessage(err.error); return; }
        throw new Error(err.error || "Failed to delete return");
      }
      toast.success("Return deleted");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete return");
    } finally { setDeleting(null); }
  };

  const columns: ColumnDef<ReturnRecord>[] = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "invoiceNo", header: "Invoice No", cell: ({ row }) => row.original.invoiceNo || "-" },
    { accessorKey: "returnDate", header: "Return Date", cell: ({ row }) => new Date(row.original.returnDate).toLocaleDateString() },
    { accessorKey: "buyer.name", header: "Buyer", cell: ({ row }) => row.original.buyer?.name || "-" },
    { accessorKey: "jobNo", header: "Job No", cell: ({ row }) => row.original.jobNo || "-" },
    { accessorKey: "total", header: "Total", cell: ({ row }) => parseFloat(row.original.total).toFixed(2) },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)} disabled={deleting === row.original.id}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  if (mode === "form") {
    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => { resetForm(); setMode("list"); }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">New Return</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Return Details */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold">Return Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Invoice No</Label>
              <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Buyer *</Label>
              <QuickCreateSelect
                label="Buyer"
                options={buyers}
                value={buyerId}
                onChange={(id) => { setBuyerId(id); setDetails([emptyDetail()]); }}
                onAdd={(item) => setBuyers((prev) => [...prev, item])}
                createUrl="/api/masters/buyers"
              contactFields
/>
            </div>
            <div className="space-y-2">
              <Label>Return Date *</Label>
              <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Job No</Label>
              <div className="flex gap-2">
                <Input
                  value={jobNo}
                  onChange={(e) => setJobNo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Tab") fetchReturnableItems(); }}
                  placeholder="Enter job no then press Enter"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={fetchReturnableItems}
                  disabled={loadingItems || !buyerId || !jobNo.trim()}
                  title="Load items for this buyer + job no"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
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
              <Input type="number" value={freight} onChange={(e) => setFreight(e.target.value ? parseFloat(e.target.value) : "")} />
            </div>
            <div className="space-y-2">
              <Label>Remark</Label>
              <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Line Items</h2>
              {loadingItems && <span className="text-sm text-muted-foreground">Loading items...</span>}
            </div>
            <Button variant="outline" size="sm" onClick={addDetailLine}>
              <Plus className="mr-2 h-4 w-4" /> Add Line
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 w-[40px]"></th>
                  <th className="text-left p-2 min-w-[200px]">Product</th>
                  <th className="text-left p-2 w-[80px]">HSN</th>
                  <th className="text-left p-2 w-[60px]">GST%</th>
                  <th className="text-left p-2 w-[100px]">Unit</th>
                  <th className="text-left p-2 w-[130px]">Return Qty</th>
                  <th className="text-left p-2 w-[110px]">Issue Price</th>
                  <th className="text-left p-2 w-[110px]">Return Price</th>
                  <th className="text-left p-2 w-[100px]">Freight</th>
                  <th className="text-left p-2 w-[100px]">Total</th>
                  <th className="p-2 w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                {details.map((line, index) => {
                  const qtyExceeded = line.maxReturnQty > 0 && Number(line.returnQuantity) > line.maxReturnQty;
                  return (
                    <tr key={index} className={`border-b ${!line.checked ? "opacity-50" : ""}`}>
                      {/* Checkbox */}
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={line.checked}
                          onChange={() => toggleCheck(index)}
                          className="h-4 w-4 cursor-pointer accent-indigo-600"
                        />
                      </td>

                      {/* Product */}
                      <td className="p-2">
                        {line.issueDetailId ? (
                          <div className="h-9 flex items-center px-2 border rounded-md bg-muted text-sm font-medium truncate">
                            {line.productName}
                          </div>
                        ) : (
                          <select
                            value={line.productId}
                            onChange={(e) => handleDetailChange(index, "productId", e.target.value ? Number(e.target.value) : "")}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                          >
                            <option value="">-- Select Product --</option>
                            {/* products not fetched here — manual rows are for edge cases */}
                          </select>
                        )}
                      </td>

                      {/* HSN (read-only from issue) */}
                      <td className="p-2">
                        <div className="h-9 flex items-center px-2 border rounded-md bg-muted text-sm text-muted-foreground">
                          {line.hsn || "-"}
                        </div>
                      </td>

                      {/* GST% (read-only from issue) */}
                      <td className="p-2">
                        <div className="h-9 flex items-center px-2 border rounded-md bg-muted text-sm text-muted-foreground">
                          {line.gst > 0 ? `${line.gst}%` : "-"}
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="p-2">
                        <select
                          value={line.unitId}
                          onChange={(e) => handleDetailChange(index, "unitId", e.target.value ? Number(e.target.value) : "")}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        >
                          <option value="">-- Unit --</option>
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Return Qty */}
                      <td className="p-2">
                        <div className="space-y-0.5">
                          <Input
                            type="number"
                            value={line.returnQuantity}
                            min={0}
                            max={line.maxReturnQty || undefined}
                            onChange={(e) => handleDetailChange(index, "returnQuantity", e.target.value ? parseFloat(e.target.value) : "")}
                            className={`h-9 ${qtyExceeded ? "border-destructive ring-1 ring-destructive" : ""}`}
                          />
                          {line.maxReturnQty > 0 && (
                            <p className={`text-[10px] ${qtyExceeded ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                              max {line.maxReturnQty}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Issue Price */}
                      <td className="p-2">
                        <Input
                          type="number"
                          value={line.issuePrice}
                          onChange={(e) => handleDetailChange(index, "issuePrice", e.target.value ? parseFloat(e.target.value) : "")}
                          className="h-9"
                        />
                      </td>

                      {/* Return Price */}
                      <td className="p-2">
                        <Input
                          type="number"
                          value={line.returnPrice}
                          onChange={(e) => handleDetailChange(index, "returnPrice", e.target.value ? parseFloat(e.target.value) : "")}
                          className="h-9"
                        />
                      </td>

                      {/* Freight */}
                      <td className="p-2">
                        <Input
                          type="number"
                          value={line.freight}
                          onChange={(e) => handleDetailChange(index, "freight", e.target.value ? parseFloat(e.target.value) : "")}
                          className="h-9"
                        />
                      </td>

                      {/* Total */}
                      <td className="p-2">
                        <Input
                          type="number"
                          value={calculateLineTotal(line)}
                          readOnly
                          className="bg-muted h-9"
                        />
                      </td>

                      {/* Delete */}
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDetailLine(index)}
                          disabled={details.length <= 1}
                          className="h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="space-y-1 text-sm text-right min-w-[220px]">
              <div className="flex justify-between gap-8 text-base font-semibold">
                <span>Grand Total:</span>
                <span>{grandTotal}</span>
              </div>
              <div className="flex justify-between gap-8 text-muted-foreground">
                <span>Round Off:</span>
                <span>{roundOff >= 0 ? "+" : ""}{roundOff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-8 text-base font-bold border-t pt-1 text-indigo-600">
                <span>Total Payable:</span>
                <span>{(parseFloat(grandTotal) + roundOff).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        <LockDialog message={lockMessage} onClose={() => setLockMessage(null)} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Returns</h1>
        <Button onClick={() => setMode("form")}>
          <Plus className="mr-2 h-4 w-4" /> New Return
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
