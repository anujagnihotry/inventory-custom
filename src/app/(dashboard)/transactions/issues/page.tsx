"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";

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

interface IssueDetailLine {
  productId: number | "";
  availableQty: number;
  quantity: number | "";
  price: number | "";
  freight: number | "";
  total: number;
  issuePrice: number | "";
  remark: string;
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
}

const emptyDetail: IssueDetailLine = {
  productId: "",
  availableQty: 0,
  quantity: "",
  price: "",
  freight: "",
  total: 0,
  issuePrice: "",
  remark: "",
};

export default function IssuesPage() {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [data, setData] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Dropdown data
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [consignees, setConsignees] = useState<Consignee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
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
      if (!res.ok) throw new Error("Failed to fetch issues");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [buyersRes, consigneesRes, productsRes] = await Promise.all([
        fetch("/api/masters/buyers"),
        fetch("/api/masters/consignees"),
        fetch("/api/masters/products"),
      ]);
      if (buyersRes.ok) setBuyers(await buyersRes.json());
      if (consigneesRes.ok) setConsignees(await consigneesRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
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

  const fetchStockForProduct = async (productId: number): Promise<{ totalQty: number; avgPrice: number }> => {
    try {
      const res = await fetch(`/api/transactions/stock/product/${productId}`);
      if (!res.ok) return { totalQty: 0, avgPrice: 0 };
      return await res.json();
    } catch {
      return { totalQty: 0, avgPrice: 0 };
    }
  };

  const handleProductChange = async (index: number, productId: number) => {
    const newDetails = [...details];
    newDetails[index].productId = productId;

    if (productId) {
      const stock = await fetchStockForProduct(productId);
      newDetails[index].availableQty = stock.totalQty;
      newDetails[index].price = parseFloat(stock.avgPrice.toFixed(2));
      newDetails[index].issuePrice = parseFloat(stock.avgPrice.toFixed(2));
    } else {
      newDetails[index].availableQty = 0;
      newDetails[index].price = "";
      newDetails[index].issuePrice = "";
    }

    recalcLineTotal(newDetails, index);
    setDetails(newDetails);
  };

  const handleDetailChange = (
    index: number,
    field: keyof IssueDetailLine,
    value: string | number
  ) => {
    const newDetails = [...details];
    (newDetails[index] as unknown as Record<string, unknown>)[field] = value;
    recalcLineTotal(newDetails, index);
    setDetails(newDetails);
  };

  const recalcLineTotal = (lines: IssueDetailLine[], index: number) => {
    const line = lines[index];
    const qty = Number(line.quantity) || 0;
    const price = Number(line.price) || 0;
    const lineFreight = Number(line.freight) || 0;
    lines[index].total = parseFloat((qty * price + lineFreight).toFixed(2));
  };

  const addDetailLine = () => {
    setDetails([...details, { ...emptyDetail }]);
  };

  const removeDetailLine = (index: number) => {
    if (details.length <= 1) return;
    setDetails(details.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = () => {
    return details.reduce((sum, d) => sum + (d.total || 0), 0).toFixed(2);
  };

  const handleSave = async () => {
    if (!consigneeId || !buyerId) {
      toast.error("Please select consignee and buyer");
      return;
    }

    const validDetails = details.filter((d) => d.productId && d.quantity);
    if (validDetails.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/transactions/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          consigneeId,
          buyerId,
          total: calculateGrandTotal(),
          vehicleNo,
          transport,
          freight: freight || 0,
          remark,
          jobNo,
          details: validDetails.map((d) => ({
            productId: d.productId,
            quantity: d.quantity,
            price: d.price || 0,
            freight: d.freight || 0,
            total: d.total,
            issuePrice: d.issuePrice || 0,
            remark: d.remark,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save issue");
      }

      toast.success("Issue created successfully");
      resetForm();
      setMode("list");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save issue");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/issues/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete issue");
      toast.success("Issue deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete issue");
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<Issue>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
    },
    {
      accessorKey: "buyer.name",
      header: "Buyer",
      cell: ({ row }) => row.original.buyer?.name || "-",
    },
    {
      accessorKey: "consignee.name",
      header: "Consignee",
      cell: ({ row }) => row.original.consignee?.name || "-",
    },
    {
      accessorKey: "jobNo",
      header: "Job No",
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => parseFloat(row.original.total).toFixed(2),
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
            <Button variant="outline" size="icon" onClick={() => { resetForm(); setMode("list"); }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">New Issue</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Header Fields */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold">Issue Details</h2>
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
              <Label>Consignee *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={consigneeId}
                onChange={(e) => setConsigneeId(e.target.value ? parseInt(e.target.value) : "")}
              >
                <option value="">Select Consignee</option>
                {consignees.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Buyer *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value ? parseInt(e.target.value) : "")}
              >
                <option value="">Select Buyer</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
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
              <Input
                type="number"
                value={freight}
                onChange={(e) => setFreight(e.target.value ? parseFloat(e.target.value) : "")}
              />
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
            <h2 className="text-lg font-semibold">Line Items</h2>
            <Button variant="outline" size="sm" onClick={addDetailLine}>
              <Plus className="mr-2 h-4 w-4" /> Add Line
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 min-w-[200px]">Product</th>
                  <th className="text-left p-2 w-[100px]">Avail Qty</th>
                  <th className="text-left p-2 w-[100px]">Quantity</th>
                  <th className="text-left p-2 w-[100px]">Price</th>
                  <th className="text-left p-2 w-[100px]">Freight</th>
                  <th className="text-left p-2 w-[100px]">Total</th>
                  <th className="text-left p-2 w-[100px]">Issue Price</th>
                  <th className="text-left p-2 min-w-[120px]">Remark</th>
                  <th className="text-left p-2 w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {details.map((line, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        value={line.productId}
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            e.target.value ? parseInt(e.target.value) : 0
                          )
                        }
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={line.availableQty}
                        readOnly
                        className="bg-muted h-9"
                      />
                    </td>
                    <td className="p-2">
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
                        className="h-9"
                      />
                    </td>
                    <td className="p-2">
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
                        className="h-9"
                      />
                    </td>
                    <td className="p-2">
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
                        className="h-9"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={line.total}
                        readOnly
                        className="bg-muted h-9"
                      />
                    </td>
                    <td className="p-2">
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
                        className="h-9"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={line.remark}
                        onChange={(e) =>
                          handleDetailChange(index, "remark", e.target.value)
                        }
                        className="h-9"
                      />
                    </td>
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
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="text-lg font-semibold">
              Grand Total: {calculateGrandTotal()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issues</h1>
        <Button onClick={() => setMode("form")}>
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
    </div>
  );
}
