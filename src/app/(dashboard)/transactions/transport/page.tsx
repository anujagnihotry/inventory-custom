"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuickCreateSelect } from "@/components/ui/quick-create-select";
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
interface Consignee {
  id: number;
  name: string;
}

interface TransportRow {
  id: number;
  consigneeId: number;
  date: string;
  buyerId: number;
  fromLocation: string | null;
  toLocation: string | null;
  transporterName: string | null;
  truckNo: string | null;
  lrDate: string | null;
  truckType: string | null;
  dala: string | null;
  freight: string;
  unloadedDate: string | null;
  buyer: { id: number; name: string };
  consignee: { id: number; name: string };
}

export default function TransportPage() {
  const [data, setData] = useState<TransportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [consignees, setConsignees] = useState<Consignee[]>([]);

  const [consigneeId, setConsigneeId] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [buyerId, setBuyerId] = useState<number | "">("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [truckNo, setTruckNo] = useState("");
  const [lrDate, setLrDate] = useState("");
  const [truckType, setTruckType] = useState("");
  const [dala, setDala] = useState("");
  const [freight, setFreight] = useState<number | "">("");
  const [unloadedDate, setUnloadedDate] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/transport");
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      toast.error("Failed to load transports");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        fetch("/api/masters/buyers"),
        fetch("/api/masters/consignees"),
      ]);
      if (bRes.ok) setBuyers(await bRes.json());
      if (cRes.ok) setConsignees(await cRes.json());
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
    setConsigneeId("");
    setDate(new Date().toISOString().split("T")[0]);
    setBuyerId("");
    setFromLocation("");
    setToLocation("");
    setTransporterName("");
    setTruckNo("");
    setLrDate("");
    setTruckType("");
    setDala("");
    setFreight("");
    setUnloadedDate("");
  };

  const openEditDialog = (row: TransportRow) => {
    setEditingId(row.id);
    setConsigneeId(row.consigneeId);
    setDate(row.date ? row.date.substring(0, 10) : "");
    setBuyerId(row.buyerId);
    setFromLocation(row.fromLocation || "");
    setToLocation(row.toLocation || "");
    setTransporterName(row.transporterName || "");
    setTruckNo(row.truckNo || "");
    setLrDate(row.lrDate ? row.lrDate.substring(0, 10) : "");
    setTruckType(row.truckType || "");
    setDala(row.dala || "");
    setFreight(Number(row.freight) || "");
    setUnloadedDate(
      row.unloadedDate ? row.unloadedDate.substring(0, 10) : ""
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!consigneeId || !buyerId || !date) {
      toast.error("Consignee, buyer, and date are required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        consigneeId,
        date,
        buyerId,
        fromLocation,
        toLocation,
        transporterName,
        truckNo,
        lrDate: lrDate || null,
        truckType,
        dala,
        freight: freight || 0,
        unloadedDate: unloadedDate || null,
      };

      const url = editingId
        ? `/api/transactions/transport/${editingId}`
        : "/api/transactions/transport";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success(
        editingId ? "Transport updated" : "Transport created"
      );
      resetForm();
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to save transport");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transport?")) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/transactions/transport/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Transport deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete transport");
    } finally {
      setDeleting(null);
    }
  };

  const columns: ColumnDef<TransportRow>[] = [
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
      accessorKey: "fromLocation",
      header: "From",
    },
    {
      accessorKey: "toLocation",
      header: "To",
    },
    {
      accessorKey: "transporterName",
      header: "Transporter",
    },
    {
      accessorKey: "truckNo",
      header: "Truck No",
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
        <h1 className="text-2xl font-bold">Transport</h1>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Transport
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Transport" : "Add Transport"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <QuickCreateSelect
                  label="Consignee"
                  createUrl="/api/masters/consignees"
                  options={consignees}
                  value={consigneeId}
                  onChange={(val) => setConsigneeId(val ? parseInt(val) : "")}
                  onAdd={(item) => setConsignees((prev) => [...prev, item])}
                />
              </div>
              <div className="space-y-2">
                <QuickCreateSelect
                  label="Buyer"
                  createUrl="/api/masters/buyers"
                  options={buyers}
                  value={buyerId}
                  onChange={(val) => setBuyerId(val ? parseInt(val) : "")}
                  onAdd={(item) => setBuyers((prev) => [...prev, item])}
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
                <Label>From Location</Label>
                <Input
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To Location</Label>
                <Input
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Transporter Name</Label>
                <Input
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Truck No</Label>
                <Input
                  value={truckNo}
                  onChange={(e) => setTruckNo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>LR Date</Label>
                <Input
                  type="date"
                  value={lrDate}
                  onChange={(e) => setLrDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Truck Type</Label>
                <Input
                  value={truckType}
                  onChange={(e) => setTruckType(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Dala</Label>
                <Input
                  value={dala}
                  onChange={(e) => setDala(e.target.value)}
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
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Unloaded Date</Label>
                <Input
                  type="date"
                  value={unloadedDate}
                  onChange={(e) => setUnloadedDate(e.target.value)}
                />
              </div>
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
