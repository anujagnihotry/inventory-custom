"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { QuickCreateSelect } from "@/components/ui/quick-create-select";
import { QuickCreateProductSelect } from "@/components/ui/quick-create-product-select";

interface Buyer {
  id: number;
  name: string;
}
interface Consignee {
  id: number;
  name: string;
}
interface Product {
  id: number;
  name: string;
}

interface TransferDetailLine {
  productId: number | "";
  quantity: number | "";
  price: number | "";
  freight: number | "";
  total: number;
  issuePrice: number | "";
}

interface IssueTransferRow {
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
  buyer: { id: number; name: string };
  consignee: { id: number; name: string };
}

const emptyDetail: TransferDetailLine = {
  productId: "",
  quantity: "",
  price: "",
  freight: "",
  total: 0,
  issuePrice: "",
};

export default function IssueTransfersPage() {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [data, setData] = useState<IssueTransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

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
  const [details, setDetails] = useState<TransferDetailLine[]>([
    { ...emptyDetail },
  ]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/issue-transfers");
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      toast.error("Failed to load issue transfers");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [bRes, cRes, pRes] = await Promise.all([
        fetch("/api/masters/buyers"),
        fetch("/api/masters/consignees"),
        fetch("/api/masters/products"),
      ]);
      if (bRes.ok) setBuyers(await bRes.json());
      if (cRes.ok) setConsignees(await cRes.json());
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
    setDate(new Date().toISOString().split("T")[0]);
    setConsigneeId("");
    setBuyerId("");
    setJobNo("");
    setVehicleNo("");
    setTransport("");
    setFreight("");
    setRemark("");
    setDetails([{ ...emptyDetail }]);
  };

  const handleDetailChange = (
    index: number,
    field: keyof TransferDetailLine,
    value: string | number
  ) => {
    const newDetails = [...details];
    (newDetails[index] as unknown as Record<string, unknown>)[field] = value;
    // Recalculate total
    const line = newDetails[index];
    const qty = Number(line.quantity) || 0;
    const p = Number(line.price) || 0;
    const f = Number(line.freight) || 0;
    newDetails[index].total = parseFloat((qty * p + f).toFixed(4));
    setDetails(newDetails);
  };

  const addDetailLine = () =>
    setDetails([...details, { ...emptyDetail }]);

  const removeDetailLine = (index: number) => {
    if (details.length <= 1) return;
    setDetails(details.filter((_, i) => i !== index));
  };

  const grandTotal = details
    .reduce((sum, d) => sum + (d.total || 0), 0)
    .toFixed(2);

  const handleSave = async () => {
    if (!consigneeId || !buyerId) {
      toast.error("Consignee and buyer are required");
      return;
    }
    const validDetails = details.filter((d) => d.productId && d.quantity);
    if (validDetails.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/transactions/issue-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          consigneeId,
          buyerId,
          total: grandTotal,
          vehicleNo,
          transport,
          freight: freight || 0,
          remark,
          jobNo,
          details: validDetails,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Issue transfer created");
      resetForm();
      setMode("list");
      fetchData();
    } catch {
      toast.error("Failed to save issue transfer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transfer?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/issue-transfers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Issue transfer deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete issue transfer");
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<IssueTransferRow>[] = [
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
      accessorFn: (row) => row.consignee?.name,
      id: "consigneeName",
      header: "Consignee",
    },
    {
      accessorKey: "jobNo",
      header: "Job No",
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) =>
        Number(row.original.total).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        }),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(row.original.id)}
          disabled={deleting === row.original.id}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  if (mode === "form") {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                resetForm();
                setMode("list");
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">New Issue Transfer</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <QuickCreateSelect
                label="Consignee *"
                createUrl="/api/masters/consignees"
                contactFields
options={consignees}
                value={consigneeId}
                onChange={(id) => setConsigneeId(id)}
                onAdd={(item) => setConsignees((prev) => [...prev, item])}
              />
            </div>
            <div className="space-y-2">
              <QuickCreateSelect
                label="Buyer *"
                createUrl="/api/masters/buyers"
                contactFields
options={buyers}
                value={buyerId}
                onChange={(id) => setBuyerId(id)}
                onAdd={(item) => setBuyers((prev) => [...prev, item])}
              />
            </div>
            <div className="space-y-2">
              <Label>Job No</Label>
              <Input
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle No</Label>
              <Input
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Transport</Label>
              <Input
                value={transport}
                onChange={(e) => setTransport(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Freight</Label>
              <Input
                type="number"
                value={freight}
                onChange={(e) =>
                  setFreight(e.target.value ? parseFloat(e.target.value) : "")
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Remark</Label>
              <Input
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Line Items</h2>
            <Button variant="outline" size="sm" onClick={addDetailLine}>
              <Plus className="mr-2 h-4 w-4" /> Add Line
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium min-w-[200px]">
                    Product *
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-[100px]">
                    Quantity
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-[100px]">
                    Price
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-[100px]">
                    Freight
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-[120px]">
                    Total
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-[100px]">
                    Issue Price
                  </th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {details.map((line, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-3 py-1">
                      <QuickCreateProductSelect
                        compact
                        options={products}
                        value={line.productId}
                        onChange={(id) => handleDetailChange(index, "productId", id)}
                        onAdd={(item) => setProducts((prev) => [...prev, item])}
                      />
                    </td>
                    <td className="px-3 py-1">
                      <Input
                        type="number"
                        value={line.quantity}
                        onChange={(e) =>
                          handleDetailChange(
                            index,
                            "quantity",
                            e.target.value ? parseFloat(e.target.value) : ""
                          )
                        }
                        className="h-9 text-right"
                        min={0}
                      />
                    </td>
                    <td className="px-3 py-1">
                      <Input
                        type="number"
                        value={line.price}
                        onChange={(e) =>
                          handleDetailChange(
                            index,
                            "price",
                            e.target.value ? parseFloat(e.target.value) : ""
                          )
                        }
                        className="h-9 text-right"
                        min={0}
                      />
                    </td>
                    <td className="px-3 py-1">
                      <Input
                        type="number"
                        value={line.freight}
                        onChange={(e) =>
                          handleDetailChange(
                            index,
                            "freight",
                            e.target.value ? parseFloat(e.target.value) : ""
                          )
                        }
                        className="h-9 text-right"
                        min={0}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {line.total.toFixed(2)}
                    </td>
                    <td className="px-3 py-1">
                      <Input
                        type="number"
                        value={line.issuePrice}
                        onChange={(e) =>
                          handleDetailChange(
                            index,
                            "issuePrice",
                            e.target.value ? parseFloat(e.target.value) : ""
                          )
                        }
                        className="h-9 text-right"
                        min={0}
                      />
                    </td>
                    <td className="px-3 py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDetailLine(index)}
                        disabled={details.length <= 1}
                        className="h-7 w-7"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <div className="text-lg font-semibold">
              Grand Total: {grandTotal}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issue Transfers</h1>
        <Button onClick={() => setMode("form")}>
          <Plus className="mr-2 h-4 w-4" /> New Transfer
        </Button>
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
