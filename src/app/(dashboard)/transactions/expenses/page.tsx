"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Buyer {
  id: number;
  name: string;
}
interface Product {
  id: number;
  name: string;
}
interface ExpenseType {
  id: number;
  name: string;
}

interface ExpenseRow {
  id: number;
  buyerId: number;
  jobCardNo: string | null;
  expenseDate: string;
  expenseTypeId: number;
  amount: string;
  remark: string | null;
  productId: number | null;
  buyer: { id: number; name: string };
  expenseType: { id: number; name: string };
  product: { id: number; name: string } | null;
}

export default function ExpensesPage() {
  const [data, setData] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);

  const [buyerId, setBuyerId] = useState<number | "">("");
  const [jobCardNo, setJobCardNo] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expenseTypeId, setExpenseTypeId] = useState<number | "">("");
  const [amount, setAmount] = useState<number | "">("");
  const [remark, setRemark] = useState("");
  const [productId, setProductId] = useState<number | "">("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/expenses");
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [bRes, pRes, eRes] = await Promise.all([
        fetch("/api/masters/buyers"),
        fetch("/api/masters/products"),
        fetch("/api/masters/expense-types"),
      ]);
      if (bRes.ok) setBuyers(await bRes.json());
      if (pRes.ok) setProducts(await pRes.json());
      if (eRes.ok) setExpenseTypes(await eRes.json());
    } catch {
      toast.error("Failed to load dropdown data");
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchDropdowns();
  }, [fetchData, fetchDropdowns]);

  const resetForm = () => {
    setEditingId(null);
    setBuyerId("");
    setJobCardNo("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setExpenseTypeId("");
    setAmount("");
    setRemark("");
    setProductId("");
  };

  const openEditDialog = (row: ExpenseRow) => {
    setEditingId(row.id);
    setBuyerId(row.buyerId);
    setJobCardNo(row.jobCardNo || "");
    setExpenseDate(
      row.expenseDate ? row.expenseDate.substring(0, 10) : ""
    );
    setExpenseTypeId(row.expenseTypeId);
    setAmount(Number(row.amount) || "");
    setRemark(row.remark || "");
    setProductId(row.productId || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!buyerId || !expenseDate || !expenseTypeId || !amount) {
      toast.error("Buyer, date, expense type, and amount are required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        buyerId,
        jobCardNo,
        expenseDate,
        expenseTypeId,
        amount,
        remark,
        productId: productId || null,
      };

      const url = editingId
        ? `/api/transactions/expenses/${editingId}`
        : "/api/transactions/expenses";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success(
        editingId ? "Expense updated" : "Expense created"
      );
      resetForm();
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/expenses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Expense deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete expense");
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<ExpenseRow>[] = [
    {
      accessorKey: "expenseDate",
      header: "Date",
      cell: ({ row }) =>
        new Date(row.original.expenseDate).toLocaleDateString("en-IN"),
    },
    {
      accessorFn: (row) => row.buyer?.name,
      id: "buyerName",
      header: "Buyer",
    },
    {
      accessorFn: (row) => row.expenseType?.name,
      id: "expenseTypeName",
      header: "Expense Type",
    },
    {
      accessorKey: "jobCardNo",
      header: "Job Card No",
    },
    {
      accessorFn: (row) => row.product?.name,
      id: "productName",
      header: "Product",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) =>
        Number(row.original.amount).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        }),
    },
    {
      accessorKey: "remark",
      header: "Remark",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
            disabled={deleting === row.original.id}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Expense" : "Add Expense"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Buyer *</Label>
              <select
                value={buyerId}
                onChange={(e) =>
                  setBuyerId(
                    e.target.value ? parseInt(e.target.value) : ""
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              <Label>Expense Type *</Label>
              <select
                value={expenseTypeId}
                onChange={(e) =>
                  setExpenseTypeId(
                    e.target.value ? parseInt(e.target.value) : ""
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select Expense Type</option>
                {expenseTypes.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <select
                value={productId}
                onChange={(e) =>
                  setProductId(
                    e.target.value ? parseInt(e.target.value) : ""
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select Product (optional)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Job Card No</Label>
              <Input
                value={jobCardNo}
                onChange={(e) => setJobCardNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Remark</Label>
              <Input
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setDialogOpen(false);
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
