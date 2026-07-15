"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { QuickCreateSelect } from "@/components/ui/quick-create-select";
import { Plus, Pencil, Trash2, Save, Eye } from "lucide-react";
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
  buyer: { id: number; name: string };
  expenseType: { id: number; name: string };
}

export default function ExpensesPage() {
  const [data, setData] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingRow, setViewingRow] = useState<ExpenseRow | null>(null);

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);

  const [buyerId, setBuyerId] = useState<number | "">("");
  const [jobCardNo, setJobCardNo] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expenseTypeId, setExpenseTypeId] = useState<number | "">("");
  const [amount, setAmount] = useState<number | "">("");
  const [remark, setRemark] = useState("");

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
      const [bRes, eRes] = await Promise.all([
        fetch("/api/masters/buyers"),
        fetch("/api/masters/expense-types"),
      ]);
      if (bRes.ok) setBuyers(await bRes.json());
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
      header: "Job No",
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="View"
            onClick={() => { setViewingRow(row.original); setViewDialogOpen(true); }}
          >
            <Eye className="h-4 w-4 text-blue-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Edit"
            onClick={() => openEditDialog(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete"
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

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {viewingRow && (
            <div className="space-y-3 pt-2 text-sm">
              {[
                ["Date", new Date(viewingRow.expenseDate).toLocaleDateString("en-IN")],
                ["Buyer", viewingRow.buyer?.name],
                ["Job No", viewingRow.jobCardNo || "-"],
                ["Expense Type", viewingRow.expenseType?.name],
                ["Amount", Number(viewingRow.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
                ["Remark", viewingRow.remark || "-"],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-2 gap-2 border-b pb-2">
                  <span className="text-muted-foreground font-medium">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit Dialog */}
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
              <QuickCreateSelect
                label="Buyer"
                createUrl="/api/masters/buyers"
                options={buyers}
                value={buyerId}
                onChange={(val) => setBuyerId(val ? parseInt(String(val)) : "")}
                onAdd={(item) => setBuyers((prev) => [...prev, item])}
              />
            </div>
            <div className="space-y-2">
              <Label>Job No</Label>
              <Input
                value={jobCardNo}
                onChange={(e) => setJobCardNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Expense Type *</Label>
              <QuickCreateSelect
                label="Expense Type"
                createUrl="/api/masters/expense-types"
                options={expenseTypes}
                value={expenseTypeId}
                onChange={(val) => setExpenseTypeId(val ? parseInt(String(val)) : "")}
                onAdd={(item) => setExpenseTypes((prev) => [...prev, item])}
              />
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
