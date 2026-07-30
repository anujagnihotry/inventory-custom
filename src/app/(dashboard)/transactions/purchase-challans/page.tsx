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

interface Supplier {
  id: number;
  name: string;
}
interface Product {
  id: number;
  name: string;
}

interface ChallanDetailLine {
  productId: number | "";
  description: string;
  hsn: string;
  quantity: number | "";
  price: number | "";
  freight: number | "";
  total: number;
}

interface PurchaseChallanRow {
  id: number;
  challanNo: string;
  date: string;
  supplierId: number;
  total: string;
  gst: string;
  supplier: { id: number; name: string };
}

const emptyDetail: ChallanDetailLine = {
  productId: "",
  description: "",
  hsn: "",
  quantity: "",
  price: "",
  freight: "",
  total: 0,
};

export default function PurchaseChallansPage() {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [data, setData] = useState<PurchaseChallanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [challanNo, setChallanNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [gst, setGst] = useState<number | "">("");
  const [details, setDetails] = useState<ChallanDetailLine[]>([
    { ...emptyDetail },
  ]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/purchase-challans");
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      toast.error("Failed to load purchase challans");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        fetch("/api/masters/suppliers"),
        fetch("/api/masters/products"),
      ]);
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
    setSupplierId("");
    setGst("");
    setDetails([{ ...emptyDetail }]);
  };

  const handleDetailChange = (
    index: number,
    field: keyof ChallanDetailLine,
    value: string | number
  ) => {
    const newDetails = [...details];
    (newDetails[index] as unknown as Record<string, unknown>)[field] = value;
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
  const subTotalNum = parseFloat(grandTotal);
  const gstNum = parseFloat(String(gst)) || 0;
  const netAmountNum = subTotalNum + gstNum;
  const roundOff = parseFloat((Math.round(netAmountNum) - netAmountNum).toFixed(2));

  const handleSave = async () => {
    if (!challanNo.trim() || !supplierId || !date) {
      toast.error("Challan No, supplier, and date are required");
      return;
    }
    const validDetails = details.filter((d) => d.productId && d.quantity);
    if (validDetails.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/transactions/purchase-challans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challanNo,
          date,
          supplierId,
          total: grandTotal,
          gst: gst || 0,
          netAmount: netAmountNum,
          roundOff: roundOff.toFixed(2),
          details: validDetails,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Purchase challan created");
      resetForm();
      setMode("list");
      fetchData();
    } catch {
      toast.error("Failed to save purchase challan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this challan?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/purchase-challans/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Purchase challan deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete purchase challan");
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<PurchaseChallanRow>[] = [
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
      accessorKey: "gst",
      header: "GST",
      cell: ({ row }) =>
        Number(row.original.gst).toLocaleString("en-IN", {
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
            <h1 className="text-2xl font-bold">New Purchase Challan</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Challan No *</Label>
              <Input
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
                placeholder="CH-001"
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
              <QuickCreateSelect
                label="Supplier *"
                createUrl="/api/masters/suppliers"
                contactFields
options={suppliers}
                value={supplierId}
                onChange={(val) => setSupplierId(val ? parseInt(String(val)) : "")}
                onAdd={(item) => setSuppliers((prev) => [...prev, item])}
              />
            </div>
            <div className="space-y-2">
              <Label>GST</Label>
              <Input
                type="number"
                value={gst}
                onChange={(e) =>
                  setGst(e.target.value ? Number(e.target.value) : "")
                }
                min={0}
              />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Challan Details</h2>
            <Button variant="outline" size="sm" onClick={addDetailLine}>
              <Plus className="mr-2 h-4 w-4" /> Add Row
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium min-w-[200px]">
                    Product *
                  </th>
                  <th className="px-3 py-2 text-left font-medium min-w-[120px]">
                    Description
                  </th>
                  <th className="px-3 py-2 text-left font-medium w-[80px]">
                    HSN
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
                        onChange={(val) =>
                          handleDetailChange(
                            index,
                            "productId",
                            val ? parseInt(String(val)) : ""
                          )
                        }
                        onAdd={(item) =>
                          setProducts((prev) => [...prev, item])
                        }
                      />
                    </td>
                    <td className="px-3 py-1">
                      <Input
                        value={line.description}
                        onChange={(e) =>
                          handleDetailChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-1">
                      <Input
                        value={line.hsn}
                        onChange={(e) =>
                          handleDetailChange(index, "hsn", e.target.value)
                        }
                        className="h-9"
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
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchase Challans</h1>
        <Button onClick={() => setMode("form")}>
          <Plus className="mr-2 h-4 w-4" /> New Challan
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
          searchKey="challanNo"
          searchPlaceholder="Search by challan no..."
        />
      )}
    </div>
  );
}
