"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

/**
 * Helper to create a sortable column definition.
 */
export function createSortableColumn<TData>(
  accessorKey: keyof TData & string,
  header: string
): ColumnDef<TData> {
  return {
    accessorKey,
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-4"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {header}
        {column.getIsSorted() === "asc" && " \u2191"}
        {column.getIsSorted() === "desc" && " \u2193"}
      </Button>
    ),
  };
}

/**
 * Helper to create a simple (non-sortable) column definition.
 */
export function createSimpleColumn<TData>(
  accessorKey: keyof TData & string,
  header: string
): ColumnDef<TData> {
  return {
    accessorKey,
    header,
  };
}

/**
 * Helper to create a column with a custom cell renderer.
 */
export function createCustomColumn<TData>(
  accessorKey: keyof TData & string,
  header: string,
  cell: ColumnDef<TData>["cell"]
): ColumnDef<TData> {
  return {
    accessorKey,
    header,
    cell,
  };
}

/**
 * Helper to create an actions column (typically the last column with edit/delete buttons).
 */
export function createActionsColumn<TData>(
  cell: ColumnDef<TData>["cell"]
): ColumnDef<TData> {
  return {
    id: "actions",
    header: "Actions",
    cell,
    enableSorting: false,
    enableHiding: false,
  };
}

/**
 * Helper to create an index/serial number column.
 */
export function createIndexColumn<TData>(): ColumnDef<TData> {
  return {
    id: "index",
    header: "#",
    cell: ({ row }) => row.index + 1,
    enableSorting: false,
  };
}

/**
 * Utility to build an array of column definitions in a type-safe way.
 */
export function createColumns<TData>(
  ...columns: ColumnDef<TData>[]
): ColumnDef<TData>[] {
  return columns;
}
