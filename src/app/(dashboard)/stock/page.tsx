"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface StockRow {
  id: number;
  productName: string;
  categoryName: string | null;
  unitName: string | null;
  totalStock: number;
  avgPrice: number;
  totalValue: number;
}

export default function StockPage() {
  const [data, setData] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  const columns: ColumnDef<StockRow>[] = [
    {
      accessorKey: "productName",
      header: "Product",
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
  ];

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock Summary</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchKey="productName"
          searchPlaceholder="Search by product..."
        />
      )}
    </div>
  );
}
