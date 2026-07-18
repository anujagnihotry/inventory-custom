"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { Eye, TrendingUp, TrendingDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StockRow {
  id: number;
  productName: string;
  categoryName: string | null;
  unitName: string | null;
  totalStock: number;
  avgPrice: number;
  totalValue: number;
}

interface HistoryEntry {
  date: string;
  type: "Opening Stock" | "Purchase" | "Issue" | "Return";
  quantity: number;
  price: number;
  sign: "+" | "-";
  invoiceNo?: string | null;
  supplierName?: string | null;
  buyerName?: string | null;
  jobNo?: string | null;
}

export default function StockPage() {
  const [data, setData] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<StockRow | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/stock");
      if (!res.ok) throw new Error("Failed to fetch stock");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const openHistory = async (row: StockRow) => {
    setHistoryProduct(row);
    setHistoryOpen(true);
    setHistory([]);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/transactions/stock/history/${row.id}`);
      if (!res.ok) throw new Error();
      setHistory(await res.json());
    } catch {
      toast.error("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Running balance for the timeline
  const historyWithBalance = history.reduce<
    (HistoryEntry & { balance: number })[]
  >((acc, entry) => {
    const prev = acc[acc.length - 1]?.balance ?? 0;
    const balance =
      entry.sign === "+" ? prev + entry.quantity : prev - entry.quantity;
    acc.push({ ...entry, balance });
    return acc;
  }, []);

  const totalIn = history
    .filter((e) => e.sign === "+")
    .reduce((s, e) => s + e.quantity, 0);
  const totalOut = history
    .filter((e) => e.sign === "-")
    .reduce((s, e) => s + e.quantity, 0);

  const typeColor: Record<HistoryEntry["type"], string> = {
    "Opening Stock": "text-blue-600",
    Purchase: "text-green-600",
    Issue: "text-red-600",
    Return: "text-orange-500",
  };

  const columns: ColumnDef<StockRow>[] = [
    {
      accessorKey: "productName",
      header: "Product",
      meta: { className: "whitespace-normal break-words max-w-xs" },
    },
    {
      accessorKey: "categoryName",
      header: "Category",
      cell: ({ row }) => row.original.categoryName || "-",
    },
    {
      accessorKey: "unitName",
      header: "Unit",
      cell: ({ row }) => row.original.unitName || "-",
    },
    {
      accessorKey: "totalStock",
      header: "Total Stock",
      cell: ({ row }) =>
        row.original.totalStock.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        }),
    },
    {
      accessorKey: "avgPrice",
      header: "Avg Price",
      cell: ({ row }) =>
        row.original.avgPrice.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        }),
    },
    {
      accessorKey: "totalValue",
      header: "Total Value",
      cell: ({ row }) =>
        row.original.totalValue.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        }),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          title="View history"
          onClick={() => openHistory(row.original)}
          className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Stock Summary"
        description="Current balance, average price, and total value per product."
      />

      {loading ? <SkeletonTable rows={6} cols={6} /> : (
        <DataTable
          columns={columns}
          data={data}
          searchKey="productName"
          searchPlaceholder="Search by product..."
        />
      )}

      {/* Stock History Dialog */}
      <Dialog
        open={historyOpen}
        onOpenChange={(open) => {
          setHistoryOpen(open);
          if (!open) {
            setHistoryProduct(null);
            setHistory([]);
          }
        }}
      >
        <DialogContent className="!w-[90vw] !max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Stock History — {historyProduct?.productName}
            </DialogTitle>
          </DialogHeader>

          {historyLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No stock movements found for this product.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary chips */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
                  <TrendingUp className="h-4 w-4" />
                  Total In: {totalIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
                  <TrendingDown className="h-4 w-4" />
                  Total Out: {totalOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                  Balance: {(totalIn - totalOut).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Timeline table */}
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Date</th>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Type</th>
                      <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Qty</th>
                      <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Price</th>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Invoice / Supplier</th>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Buyer</th>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Job No</th>
                      <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyWithBalance.map((entry, idx) => (
                      <tr
                        key={idx}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          {new Date(entry.date).toLocaleDateString("en-IN")}
                        </td>
                        <td className={`px-3 py-2 font-medium whitespace-nowrap ${typeColor[entry.type]}`}>
                          {entry.sign === "+" ? "▲" : "▼"} {entry.type}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium whitespace-nowrap ${entry.sign === "+" ? "text-green-700" : "text-red-700"}`}>
                          {entry.sign}{entry.quantity.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {entry.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        {/* Invoice / Supplier — Purchase only */}
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {entry.type === "Purchase"
                            ? [entry.invoiceNo, entry.supplierName].filter(Boolean).join(" · ")
                            : "—"}
                        </td>
                        {/* Buyer — Issue & Return */}
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {(entry.type === "Issue" || entry.type === "Return")
                            ? (entry.buyerName ?? "—")
                            : "—"}
                        </td>
                        {/* Job No — Issue & Return */}
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          {(entry.type === "Issue" || entry.type === "Return")
                            ? (entry.jobNo ?? "—")
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                          {entry.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
