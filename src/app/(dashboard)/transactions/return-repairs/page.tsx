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
interface Product {
  id: number;
  name: string;
}

interface ReturnRepairDetailLine {
  productId: number | "";
  returnRepairQuantity: number | "";
  issuePrice: number | "";
  returnPrice: number | "";
  freight: number | "";
}

interface ReturnRepairRow {
  id: number;
  invoiceNo: string | null;
  buyerId: number;
  receiveDate: string;
  total: string;
  jobNo: string | null;
  buyer: { id: number; name: string };
}

const emptyDetail: ReturnRepairDetailLine = {
  productId: "",
  returnRepairQuantity: "",
  issuePrice: "",
  returnPrice: "",
  freight: "",
};

export default function ReturnRepairsPage() {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [data, setData] = useState<ReturnRepairRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [buyerId, setBuyerId] = useState<number | "">("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transport, setTransport] = useState("");
  const [headerFreight, setHeaderFreight] = useState<number | "">("");
  const [receiveDate, setReceiveDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [jobNo, setJobNo] = useState("");
  const [details, setDetails] = useState<ReturnRepairDetailLine[]>([
    { ...emptyDetail },
  ]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/return-repairs");
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      toast.error("Failed to load return repairs");
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
    setInvoiceNo("");
    setBuyerId("");
    setVehicleNo("");
    setTransport("");
    setHeaderFreight("");
    setReceiveDate(new Date().toISOString().split("T")[0]);
    setJobNo("");
    setDetails([{ ...emptyDetail }]);
  };

  const handleDetailChange = (
    index: number,
    field: keyof ReturnRepairDetailLine,
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

  const grandTotal = details
    .reduce((sum, d) => {
      const qty = Number(d.returnRepairQuantity) || 0;
      const price = Number(d.returnPrice) || 0;
      return sum + qty * price;
    }, 0)
    .toFixed(2);

  const roundOff = parseFloat((Math.round(parseFloat(grandTotal)) - parseFloat(grandTotal)).toFixed(2));

  const handleSave = async () => {
    if (!buyerId || !receiveDate) {
      toast.error("Buyer and date are required");
      return;
    }
    const validDetails = details.filter(
      (d) => d.productId && d.returnRepairQuantity
    );
    if (validDetails.length === 0) {
      toast.error("At least one line item is required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/transactions/return-repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNo,
          buyerId,
          vehicleNo,
          transport,
          freight: headerFreight || 0,
          receiveDate,
          total: grandTotal,
          roundOff: roundOff.toFixed(2),
          jobNo,
          details: validDetails,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Return repair created");
      resetForm();
      setMode("list");
      fetchData();
    } catch {
      toast.error("Failed to save return repair");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this return repair?"))
      return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/return-repairs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Return repair deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete return repair");
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<ReturnRepairRow>[] = [
    {
      accessorKey: "invoiceNo",
      header: "Invoice No",
    },
    {
      accessorKey: "receiveDate",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.receiveDate).toLocaleDateString("en-IN"),
    },
    {
      accessorFn: (row) => row.buyer?.name,
      id: "buyerName",
      header: "Buyer",
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
            <h1 className="text-2xl font-bold">New Return Repair</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Invoice No</Label>
              <Input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <QuickCreateSelect
                label="Buyer *"
                createUrl="/api/masters/buyers"
                contactFields
options={buyers}
                value={buyerId}
                onChange={(val) => setBuyerId(val ? parseInt(String(val)) : "")}
                onAdd={(item) => setBuyers((prev) => [...prev, item])}
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
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
                value={headerFreight}
                onChange={(e) =>
                  setHeaderFreight(
                    e.target.value ? parseFloat(e.target.value) : ""
                  )
                }
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
                    Quantity *
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-[100px]">
                    Issue Price
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-[100px]">
                    Return Price
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-[100px]">
                    Freight
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
                        type="number"
                        value={line.returnRepairQuantity}
                        onChange={(e) =>
                          handleDetailChange(
                            index,
                            "returnRepairQuantity",
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
                      <Input
                        type="number"
                        value={line.returnPrice}
                        onChange={(e) =>
                          handleDetailChange(
                            index,
                            "returnPrice",
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
        <h1 className="text-2xl font-bold">Return Repairs</h1>
        <Button onClick={() => setMode("form")}>
          <Plus className="mr-2 h-4 w-4" /> New Return Repair
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
