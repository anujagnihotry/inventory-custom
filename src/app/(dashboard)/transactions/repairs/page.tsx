"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";

interface Consignee {
  id: number;
  name: string;
}
interface Supplier {
  id: number;
  name: string;
}
interface Product {
  id: number;
  name: string;
}

interface RepairDetailLine {
  productId: number | "";
  quantity: number | "";
  remark: string;
}

interface RepairRow {
  id: number;
  challanNo: string | null;
  date: string;
  consigneeId: number;
  supplierId: number;
  freight: string;
  total: string;
  remark: string | null;
  consignee: { id: number; name: string };
  supplier: { id: number; name: string };
}

const emptyDetail: RepairDetailLine = {
  productId: "",
  quantity: "",
  remark: "",
};

export default function RepairsPage() {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [data, setData] = useState<RepairRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [consignees, setConsignees] = useState<Consignee[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [challanNo, setChallanNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [consigneeId, setConsigneeId] = useState<number | "">("");
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [freight, setFreight] = useState<number | "">("");
  const [total, setTotal] = useState<number | "">("");
  const [remark, setRemark] = useState("");
  const [details, setDetails] = useState<RepairDetailLine[]>([
    { ...emptyDetail },
  ]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/repairs");
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      toast.error("Failed to load repairs");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [cRes, sRes, pRes] = await Promise.all([
        fetch("/api/masters/consignees"),
        fetch("/api/masters/suppliers"),
        fetch("/api/masters/products"),
      ]);
      if (cRes.ok) setConsignees(await cRes.json());
      if (sRes.ok) setSuppliers(await sRes.json());
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
    setChallanNo("");
    setDate(new Date().toISOString().split("T")[0]);
    setConsigneeId("");
    setSupplierId("");
    setFreight("");
    setTotal("");
    setRemark("");
    setDetails([{ ...emptyDetail }]);
  };

  const handleDetailChange = (
    index: number,
    field: keyof RepairDetailLine,
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
    if (!consigneeId || !supplierId || !date) {
      toast.error("Consignee, supplier, and date are required");
      return;
    }
    const validDetails = details.filter((d) => d.productId && d.quantity);
    if (validDetails.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/transactions/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challanNo,
          date,
          consigneeId,
          supplierId,
          freight: freight || 0,
          total: total || 0,
          remark,
          details: validDetails,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Repair created");
      resetForm();
      setMode("list");
      fetchData();
    } catch {
      toast.error("Failed to save repair");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this repair?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/repairs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Repair deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete repair");
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<RepairRow>[] = [
    {
      accessorKey: "challanNo",
      header: "Challan No",
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.date).toLocaleDateString("en-IN"),
    },
    {
      accessorFn: (row) => row.consignee?.name,
      id: "consigneeName",
      header: "Consignee",
    },
    {
      accessorFn: (row) => row.supplier?.name,
      id: "supplierName",
      header: "Supplier",
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
      accessorKey: "freight",
      header: "Freight",
      cell: ({ row }) =>
        Number(row.original.freight).toLocaleString("en-IN", {
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
            <h1 className="text-2xl font-bold">New Repair From Godown</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Challan No</Label>
              <Input
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
              />
            </div>
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
              <Label>Supplier *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={supplierId}
                onChange={(e) =>
                  setSupplierId(
                    e.target.value ? parseInt(e.target.value) : ""
                  )
                }
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Freight</Label>
              <Input
                type="number"
                value={freight}
                onChange={(e) =>
                  setFreight(
                    e.target.value ? parseFloat(e.target.value) : ""
                  )
                }
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Total</Label>
              <Input
                type="number"
                value={total}
                onChange={(e) =>
                  setTotal(
                    e.target.value ? parseFloat(e.target.value) : ""
                  )
                }
                min={0}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
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
        <h1 className="text-2xl font-bold">Repair From Godown</h1>
        <Button onClick={() => setMode("form")}>
          <Plus className="mr-2 h-4 w-4" /> New Repair
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
