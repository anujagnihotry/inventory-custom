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
  unitId?: number;
}

interface Unit {
  id: number;
  name: string;
}

interface ReturnDetailLine {
  productId: number | "";
  unitId: number | "";
  returnQuantity: number | "";
  issuePrice: number | "";
  returnPrice: number | "";
  freight: number | "";
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

const emptyDetail: ReturnDetailLine = {
  productId: "",
  unitId: "",
  returnQuantity: "",
  issuePrice: "",
  returnPrice: "",
  freight: "",
};

export default function ReturnsPage() {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [data, setData] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Dropdown data
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Form state
  const [invoiceNo, setInvoiceNo] = useState("");
  const [buyerId, setBuyerId] = useState<number | "">("");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [jobNo, setJobNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transport, setTransport] = useState("");
  const [freight, setFreight] = useState<number | "">("");
  const [remark, setRemark] = useState("");
  const [details, setDetails] = useState<ReturnDetailLine[]>([
    { ...emptyDetail },
  ]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/returns");
      if (!res.ok) throw new Error("Failed to fetch returns");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load returns");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [buyersRes, productsRes, unitsRes] = await Promise.all([
        fetch("/api/masters/buyers"),
        fetch("/api/masters/products"),
        fetch("/api/masters/units"),
      ]);
      if (buyersRes.ok) setBuyers(await buyersRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
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
    setReturnDate(new Date().toISOString().split("T")[0]);
    setJobNo("");
    setVehicleNo("");
    setTransport("");
    setFreight("");
    setRemark("");
    setDetails([{ ...emptyDetail }]);
  };

  const handleDetailChange = (
    index: number,
    field: keyof ReturnDetailLine,
    value: string | number
  ) => {
    const newDetails = [...details];
    const line = { ...newDetails[index], [field]: value };
    if (field === "productId") {
      const prod = products.find((p) => p.id === Number(value));
      if (prod?.unitId) line.unitId = prod.unitId;
    }
    newDetails[index] = line;
    setDetails(newDetails);
  };

  const addDetailLine = () => {
    setDetails([...details, { ...emptyDetail }]);
  };

  const removeDetailLine = (index: number) => {
    if (details.length <= 1) return;
    setDetails(details.filter((_, i) => i !== index));
  };

  const calculateLineTotal = (line: ReturnDetailLine) => {
    const qty = Number(line.returnQuantity) || 0;
    const price = Number(line.returnPrice) || 0;
    const lineFreight = Number(line.freight) || 0;
    return parseFloat((qty * price + lineFreight).toFixed(2));
  };

  const calculateGrandTotal = () => {
    return details
      .reduce((sum, d) => sum + calculateLineTotal(d), 0)
      .toFixed(2);
  };

  const handleSave = async () => {
    if (!buyerId) {
      toast.error("Please select a buyer");
      return;
    }

    const validDetails = details.filter(
      (d) => d.productId && d.returnQuantity
    );
    if (validDetails.length === 0) {
      toast.error("Please add at least one line item");
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
          total: calculateGrandTotal(),
          vehicleNo,
          transport,
          freight: freight || 0,
          jobNo,
          remark,
          details: validDetails.map((d) => ({
            productId: d.productId,
            unitId: d.unitId || null,
            returnQuantity: d.returnQuantity,
            issuePrice: d.issuePrice || 0,
            returnPrice: d.returnPrice || 0,
            freight: d.freight || 0,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save return");
      }

      toast.success("Return created successfully");
      resetForm();
      setMode("list");
      fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save return"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this return?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/returns/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete return");
      toast.success("Return deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete return");
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<ReturnRecord>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "invoiceNo",
      header: "Invoice No",
      cell: ({ row }) => row.original.invoiceNo || "-",
    },
    {
      accessorKey: "returnDate",
      header: "Return Date",
      cell: ({ row }) =>
        new Date(row.original.returnDate).toLocaleDateString(),
    },
    {
      accessorKey: "buyer.name",
      header: "Buyer",
      cell: ({ row }) => row.original.buyer?.name || "-",
    },
    {
      accessorKey: "jobNo",
      header: "Job No",
      cell: ({ row }) => row.original.jobNo || "-",
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
            <h1 className="text-2xl font-bold">New Return</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Header Fields */}
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold">Return Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Invoice No</Label>
              <Input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Buyer *</Label>
              <QuickCreateSelect
                label="Buyer"
                options={buyers}
                value={buyerId}
                onChange={(id) => setBuyerId(id)}
                onAdd={(item) => setBuyers((prev) => [...prev, item])}
                createUrl="/api/masters/buyers"
              />
            </div>
            <div className="space-y-2">
              <Label>Return Date *</Label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
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
                  setFreight(
                    e.target.value ? parseFloat(e.target.value) : ""
                  )
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
                  <th className="text-left p-2 w-[120px]">Unit</th>
                  <th className="text-left p-2 w-[120px]">Return Qty</th>
                  <th className="text-left p-2 w-[120px]">Issue Price</th>
                  <th className="text-left p-2 w-[120px]">Return Price</th>
                  <th className="text-left p-2 w-[120px]">Freight</th>
                  <th className="text-left p-2 w-[120px]">Total</th>
                  <th className="text-left p-2 w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {details.map((line, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">
                      <QuickCreateProductSelect
                        compact
                        options={products}
                        value={line.productId}
                        onChange={(id) => handleDetailChange(index, "productId", id)}
                        onAdd={(item) =>
                          setProducts((prev) => [...prev, item])
                        }
                      />
                    </td>
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
                    <td className="p-2">
                      <Input
                        type="number"
                        value={line.returnQuantity}
                        onChange={(e) =>
                          handleDetailChange(
                            index,
                            "returnQuantity",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : ""
                          )
                        }
                        className="h-9"
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
                            e.target.value
                              ? parseFloat(e.target.value)
                              : ""
                          )
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={line.returnPrice}
                        onChange={(e) =>
                          handleDetailChange(
                            index,
                            "returnPrice",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : ""
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
                            e.target.value
                              ? parseFloat(e.target.value)
                              : ""
                          )
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={calculateLineTotal(line)}
                        readOnly
                        className="bg-muted h-9"
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
    </div>
  );
}
