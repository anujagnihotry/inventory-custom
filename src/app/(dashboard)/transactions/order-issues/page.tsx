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

interface OrderIssueDetailLine {
  productId: number | "";
  quantity: number | "";
  remark: string;
}

interface OrderIssueRow {
  id: number;
  issueChallanNo: string;
  issueDate: string;
  consigneeId: number;
  buyerId: number;
  remark: string | null;
  jobNo: string | null;
  buyer: { id: number; name: string };
  consignee: { id: number; name: string };
}

const emptyDetail: OrderIssueDetailLine = {
  productId: "",
  quantity: "",
  remark: "",
};

export default function OrderIssuesPage() {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [data, setData] = useState<OrderIssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [consignees, setConsignees] = useState<Consignee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [issueChallanNo, setIssueChallanNo] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [consigneeId, setConsigneeId] = useState<number | "">("");
  const [buyerId, setBuyerId] = useState<number | "">("");
  const [jobNo, setJobNo] = useState("");
  const [remark, setRemark] = useState("");
  const [details, setDetails] = useState<OrderIssueDetailLine[]>([
    { ...emptyDetail },
  ]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/order-issues");
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      toast.error("Failed to load order issues");
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
    setIssueChallanNo("");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setConsigneeId("");
    setBuyerId("");
    setJobNo("");
    setRemark("");
    setDetails([{ ...emptyDetail }]);
  };

  const handleDetailChange = (
    index: number,
    field: keyof OrderIssueDetailLine,
    value: string | number
  ) => {
    const newDetails = [...details];
    (newDetails[index] as unknown as Record<string, unknown>)[field] = value;
    setDetails(newDetails);
  };

  const addDetailLine = () =>
    setDetails([...details, { ...emptyDetail }]);

  const removeDetailLine = (index: number) => {
    if (details.length <= 1) return;
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!issueChallanNo.trim() || !consigneeId || !buyerId) {
      toast.error("Challan No, consignee, and buyer are required");
      return;
    }
    const validDetails = details.filter((d) => d.productId && d.quantity);
    if (validDetails.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/transactions/order-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueChallanNo,
          issueDate,
          consigneeId,
          buyerId,
          remark,
          jobNo,
          details: validDetails,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Order issue created");
      resetForm();
      setMode("list");
      fetchData();
    } catch {
      toast.error("Failed to save order issue");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this order issue?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/order-issues/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Order issue deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete order issue");
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<OrderIssueRow>[] = [
    {
      accessorKey: "issueChallanNo",
      header: "Challan No",
    },
    {
      accessorKey: "issueDate",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.issueDate).toLocaleDateString("en-IN"),
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
            <h1 className="text-2xl font-bold">New Order Issue</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Challan No *</Label>
              <Input
                value={issueChallanNo}
                onChange={(e) => setIssueChallanNo(e.target.value)}
                placeholder="CH-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Consignee *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={consigneeId}
                onChange={(e) =>
                  setConsigneeId(
                    e.target.value ? parseInt(e.target.value) : ""
                  )
                }
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
                onChange={(e) =>
                  setBuyerId(e.target.value ? parseInt(e.target.value) : "")
                }
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
              <Input
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Remark</Label>
            <Input
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
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
                  <th className="px-3 py-2 text-right font-medium w-[120px]">
                    Quantity *
                  </th>
                  <th className="px-3 py-2 text-left font-medium min-w-[150px]">
                    Remark
                  </th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {details.map((line, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-3 py-1">
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                        value={line.productId}
                        onChange={(e) =>
                          handleDetailChange(
                            index,
                            "productId",
                            e.target.value ? parseInt(e.target.value) : ""
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
                        value={line.remark}
                        onChange={(e) =>
                          handleDetailChange(index, "remark", e.target.value)
                        }
                        className="h-9"
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
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order Issues</h1>
        <Button onClick={() => setMode("form")}>
          <Plus className="mr-2 h-4 w-4" /> New Order Issue
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchKey="issueChallanNo"
          searchPlaceholder="Search by challan no..."
        />
      )}
    </div>
  );
}
