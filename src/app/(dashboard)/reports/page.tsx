"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DropdownItem {
  id: number;
  name: string;
}

interface StockRow {
  productId: number;
  product: string;
  category: string;
  unit: string;
  totalStock: number;
  avgPrice: number;
  totalValue: number;
}

interface PurchaseInfoRow {
  id: number;
  invoiceNo: string;
  supplier: string;
  date: string;
  total: number;
  gst: number;
  netAmount: number;
  vehicleNo: string | null;
  transport: string | null;
}

interface PurchaseProductRow {
  purchaseId: number;
  invoiceNo: string;
  supplier: string;
  date: string;
  product: string;
  description: string | null;
  hsn: string | null;
  quantity: number;
  price: number;
  freight: number;
  total: number;
}

interface BuyerIssueRow {
  issueId: number;
  date: string;
  buyer: string;
  consignee: string;
  jobNo: string | null;
  product: string;
  quantity: number;
  price: number;
  issuePrice: number;
  freight: number;
  total: number;
  remark: string | null;
}

interface ConsigneeIssueRow {
  issueId: number;
  date: string;
  buyer: string;
  consignee: string;
  jobNo: string | null;
  product: string;
  quantity: number;
  price: number;
  issuePrice: number;
  freight: number;
  total: number;
  remark: string | null;
}

interface ProductMovement {
  type: string;
  date: string;
  party: string;
  quantity: number;
  price: number;
  total: number;
  reference: string;
}

interface TransportRow {
  id: number;
  date: string;
  buyer: string;
  consignee: string;
  fromLocation: string | null;
  toLocation: string | null;
  transporterName: string | null;
  truckNo: string | null;
  lrDate: string | null;
  truckType: string | null;
  dala: string | null;
  freight: number;
  unloadedDate: string | null;
}

interface ReturnRow {
  returnId: number;
  invoiceNo: string | null;
  buyer: string;
  returnDate: string;
  jobNo: string | null;
  product: string;
  returnQuantity: number;
  issuePrice: number;
  returnPrice: number;
  freight: number;
  total: number;
  remark: string | null;
}

interface HsnRow {
  productId: number;
  product: string;
  category: string;
  unit: string;
  hsn: string;
}

interface SiteEvalRow {
  buyer: string;
  name: string;
  value: number;
  type: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const fmtDate = (d: string) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN");
};

const exportToPDF = async (elementId: string, title: string) => {
  try {
    const { default: html2canvas } = await import("html2canvas");
    const { default: jsPDF } = await import("jspdf");
    const element = document.getElementById(elementId);
    if (!element) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const imgWidth = 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.text(title, 14, 15);
    pdf.addImage(imgData, "PNG", 14, 25, imgWidth, imgHeight);
    pdf.save(`${title}.pdf`);
    toast.success("PDF exported successfully");
  } catch {
    toast.error("Failed to export PDF");
  }
};

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const TABS = [
  { key: "stock-summary", label: "Stock Summary" },
  { key: "purchase-info", label: "Purchase Info" },
  { key: "purchase-product", label: "Purchase Product-wise" },
  { key: "buyer-issues", label: "Buyer Issues" },
  { key: "consignee-issues", label: "Consignee Issues" },
  { key: "product-tracking", label: "Product Tracking" },
  { key: "transport", label: "Transport" },
  { key: "returns", label: "Returns" },
  { key: "hsn-products", label: "HSN Products" },
  { key: "site-evaluation", label: "Site Evaluation" },
] as const;

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<string>("stock-summary");

  // Dropdown data
  const [buyers, setBuyers] = useState<DropdownItem[]>([]);
  const [consignees, setConsignees] = useState<DropdownItem[]>([]);
  const [suppliers, setSuppliers] = useState<DropdownItem[]>([]);
  const [products, setProducts] = useState<DropdownItem[]>([]);

  // Filters
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState("");
  const [selectedConsignee, setSelectedConsignee] = useState("");
  const [jobNo, setJobNo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Data
  const [stockData, setStockData] = useState<StockRow[]>([]);
  const [purchaseInfoData, setPurchaseInfoData] = useState<PurchaseInfoRow[]>(
    []
  );
  const [purchaseProductData, setPurchaseProductData] = useState<
    PurchaseProductRow[]
  >([]);
  const [buyerIssueData, setBuyerIssueData] = useState<BuyerIssueRow[]>([]);
  const [consigneeIssueData, setConsigneeIssueData] = useState<
    ConsigneeIssueRow[]
  >([]);
  const [productTrackingData, setProductTrackingData] = useState<
    ProductMovement[]
  >([]);
  const [transportData, setTransportData] = useState<TransportRow[]>([]);
  const [returnData, setReturnData] = useState<ReturnRow[]>([]);
  const [hsnData, setHsnData] = useState<HsnRow[]>([]);
  const [siteEvalData, setSiteEvalData] = useState<SiteEvalRow[]>([]);
  const [siteEvalSummary, setSiteEvalSummary] = useState({
    expencesTotal: 0,
    returnsTotal: 0,
    grandTotal: 0,
    salesTotal: 0,
    plTotal: 0,
  });

  const [loading, setLoading] = useState(false);

  // Load dropdown data on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, cRes, sRes, pRes] = await Promise.all([
          fetch("/api/masters/buyers"),
          fetch("/api/masters/consignees"),
          fetch("/api/masters/suppliers"),
          fetch("/api/masters/products"),
        ]);
        if (bRes.ok) setBuyers(await bRes.json());
        if (cRes.ok) setConsignees(await cRes.json());
        if (sRes.ok) setSuppliers(await sRes.json());
        if (pRes.ok) setProducts(await pRes.json());
      } catch {
        // Silently handle - dropdowns will just be empty
      }
    };
    load();
  }, []);

  // Auto-load data for tabs that don't need filters
  useEffect(() => {
    if (activeTab === "stock-summary" && stockData.length === 0) {
      fetchStockSummary();
    } else if (activeTab === "transport" && transportData.length === 0) {
      fetchTransport();
    } else if (activeTab === "hsn-products" && hsnData.length === 0) {
      fetchHsnProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ---------------------------------------------------------------------------
  // Fetch functions
  // ---------------------------------------------------------------------------

  const fetchStockSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/stock-summary");
      if (!res.ok) throw new Error();
      setStockData(await res.json());
    } catch {
      toast.error("Failed to load stock summary");
    }
    setLoading(false);
  };

  const fetchPurchaseInfo = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSupplier) params.set("supplierId", selectedSupplier);
      const res = await fetch(`/api/reports/purchase-info?${params}`);
      if (!res.ok) throw new Error();
      setPurchaseInfoData(await res.json());
    } catch {
      toast.error("Failed to load purchase info");
    }
    setLoading(false);
  }, [selectedSupplier]);

  const fetchPurchaseProduct = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProduct) params.set("productId", selectedProduct);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const res = await fetch(`/api/reports/purchase-product-wise?${params}`);
      if (!res.ok) throw new Error();
      setPurchaseProductData(await res.json());
    } catch {
      toast.error("Failed to load purchase product report");
    }
    setLoading(false);
  }, [selectedProduct, dateFrom, dateTo]);

  const fetchBuyerIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBuyer) params.set("buyerId", selectedBuyer);
      if (jobNo) params.set("jobNo", jobNo);
      const res = await fetch(`/api/reports/buyer-issue?${params}`);
      if (!res.ok) throw new Error();
      setBuyerIssueData(await res.json());
    } catch {
      toast.error("Failed to load buyer issue report");
    }
    setLoading(false);
  }, [selectedBuyer, jobNo]);

  const fetchConsigneeIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedConsignee) params.set("consigneeId", selectedConsignee);
      const res = await fetch(`/api/reports/consignee-issue?${params}`);
      if (!res.ok) throw new Error();
      setConsigneeIssueData(await res.json());
    } catch {
      toast.error("Failed to load consignee issue report");
    }
    setLoading(false);
  }, [selectedConsignee]);

  const fetchProductTracking = useCallback(async () => {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/product-tracking?productId=${selectedProduct}`
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      setProductTrackingData(json.movements || []);
    } catch {
      toast.error("Failed to load product tracking");
    }
    setLoading(false);
  }, [selectedProduct]);

  const fetchTransport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/transport");
      if (!res.ok) throw new Error();
      setTransportData(await res.json());
    } catch {
      toast.error("Failed to load transport report");
    }
    setLoading(false);
  };

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBuyer) params.set("buyerId", selectedBuyer);
      const res = await fetch(`/api/reports/buyer-return?${params}`);
      if (!res.ok) throw new Error();
      setReturnData(await res.json());
    } catch {
      toast.error("Failed to load returns report");
    }
    setLoading(false);
  }, [selectedBuyer]);

  const fetchHsnProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/hsn-products");
      if (!res.ok) throw new Error();
      setHsnData(await res.json());
    } catch {
      toast.error("Failed to load HSN products");
    }
    setLoading(false);
  };

  const fetchSiteEvaluation = useCallback(async () => {
    if (!selectedBuyer) {
      toast.error("Please select a buyer");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("buyerId", selectedBuyer);
      if (jobNo) params.set("jobNo", jobNo);
      const res = await fetch(`/api/reports/site-evaluation?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setSiteEvalData(json.rows || []);
      setSiteEvalSummary(
        json.summary || { expencesTotal: 0, returnsTotal: 0, grandTotal: 0, salesTotal: 0, plTotal: 0 }
      );
    } catch {
      toast.error("Failed to load site evaluation");
    }
    setLoading(false);
  }, [selectedBuyer, jobNo]);

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------

  const stockColumns: ColumnDef<StockRow>[] = [
    { accessorKey: "product", header: "Product" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "unit", header: "Unit" },
    {
      accessorKey: "totalStock",
      header: "Total Stock",
      cell: ({ row }) => fmt(row.original.totalStock),
    },
    {
      accessorKey: "avgPrice",
      header: "Avg Price",
      cell: ({ row }) => fmt(row.original.avgPrice),
    },
    {
      accessorKey: "totalValue",
      header: "Total Value",
      cell: ({ row }) => fmt(row.original.totalValue),
    },
  ];

  const purchaseInfoColumns: ColumnDef<PurchaseInfoRow>[] = [
    { accessorKey: "invoiceNo", header: "Invoice No" },
    { accessorKey: "supplier", header: "Supplier" },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => fmtDate(row.original.date),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => fmt(row.original.total),
    },
    {
      accessorKey: "gst",
      header: "GST",
      cell: ({ row }) => fmt(row.original.gst),
    },
    {
      accessorKey: "netAmount",
      header: "Net Amount",
      cell: ({ row }) => fmt(row.original.netAmount),
    },
    { accessorKey: "vehicleNo", header: "Vehicle No" },
  ];

  const purchaseProductColumns: ColumnDef<PurchaseProductRow>[] = [
    { accessorKey: "invoiceNo", header: "Invoice No" },
    { accessorKey: "supplier", header: "Supplier" },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => fmtDate(row.original.date),
    },
    { accessorKey: "product", header: "Product" },
    { accessorKey: "hsn", header: "HSN" },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => fmt(row.original.quantity),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => fmt(row.original.price),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => fmt(row.original.total),
    },
  ];

  const buyerIssueColumns: ColumnDef<BuyerIssueRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => fmtDate(row.original.date),
    },
    { accessorKey: "buyer", header: "Buyer" },
    { accessorKey: "consignee", header: "Consignee" },
    { accessorKey: "jobNo", header: "Job No" },
    { accessorKey: "product", header: "Product" },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => fmt(row.original.quantity),
    },
    {
      accessorKey: "issuePrice",
      header: "Issue Price",
      cell: ({ row }) => fmt(row.original.issuePrice),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => fmt(row.original.total),
    },
  ];

  const consigneeIssueColumns: ColumnDef<ConsigneeIssueRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => fmtDate(row.original.date),
    },
    { accessorKey: "buyer", header: "Buyer" },
    { accessorKey: "consignee", header: "Consignee" },
    { accessorKey: "jobNo", header: "Job No" },
    { accessorKey: "product", header: "Product" },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => fmt(row.original.quantity),
    },
    {
      accessorKey: "issuePrice",
      header: "Issue Price",
      cell: ({ row }) => fmt(row.original.issuePrice),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => fmt(row.original.total),
    },
  ];

  const productTrackingColumns: ColumnDef<ProductMovement>[] = [
    { accessorKey: "type", header: "Type" },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => fmtDate(row.original.date),
    },
    { accessorKey: "party", header: "Party" },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => fmt(row.original.quantity),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => fmt(row.original.price),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => fmt(row.original.total),
    },
    { accessorKey: "reference", header: "Reference" },
  ];

  const transportColumns: ColumnDef<TransportRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => fmtDate(row.original.date),
    },
    { accessorKey: "buyer", header: "Buyer" },
    { accessorKey: "consignee", header: "Consignee" },
    { accessorKey: "fromLocation", header: "From" },
    { accessorKey: "toLocation", header: "To" },
    { accessorKey: "transporterName", header: "Transporter" },
    { accessorKey: "truckNo", header: "Truck No" },
    { accessorKey: "truckType", header: "Truck Type" },
    {
      accessorKey: "freight",
      header: "Freight",
      cell: ({ row }) => fmt(row.original.freight),
    },
  ];

  const returnColumns: ColumnDef<ReturnRow>[] = [
    { accessorKey: "invoiceNo", header: "Invoice No" },
    { accessorKey: "buyer", header: "Buyer" },
    {
      accessorKey: "returnDate",
      header: "Return Date",
      cell: ({ row }) => fmtDate(row.original.returnDate),
    },
    { accessorKey: "jobNo", header: "Job No" },
    { accessorKey: "product", header: "Product" },
    {
      accessorKey: "returnQuantity",
      header: "Qty",
      cell: ({ row }) => fmt(row.original.returnQuantity),
    },
    {
      accessorKey: "returnPrice",
      header: "Return Price",
      cell: ({ row }) => fmt(row.original.returnPrice),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => fmt(row.original.total),
    },
  ];

  const hsnColumns: ColumnDef<HsnRow>[] = [
    { accessorKey: "product", header: "Product" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "unit", header: "Unit" },
    { accessorKey: "hsn", header: "HSN Code" },
  ];

  const siteEvalColumns: ColumnDef<SiteEvalRow>[] = [
    { accessorKey: "type", header: "Category" },
    { accessorKey: "name", header: "Description" },
    {
      accessorKey: "value",
      header: "Value (₹)",
      cell: ({ row }) => (
        <span className={row.original.value < 0 ? "text-red-600" : ""}>
          {fmt(row.original.value)}
        </span>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Chart data helpers
  // ---------------------------------------------------------------------------

  const stockPieData = () => {
    const categoryMap: Record<string, number> = {};
    stockData.forEach((r) => {
      categoryMap[r.category] = (categoryMap[r.category] || 0) + r.totalValue;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));
  };

  const purchaseBarData = () => {
    const monthMap: Record<string, number> = {};
    purchaseInfoData.forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + r.netAmount;
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }));
  };

  const purchaseProductBarData = () => {
    const monthMap: Record<string, number> = {};
    purchaseProductData.forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + r.total;
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }));
  };

  const buyerIssueBarData = () => {
    const productMap: Record<string, number> = {};
    buyerIssueData.forEach((r) => {
      productMap[r.product] = (productMap[r.product] || 0) + r.total;
    });
    return Object.entries(productMap)
      .slice(0, 15)
      .map(([product, total]) => ({
        product,
        total: Math.round(total * 100) / 100,
      }));
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderDropdown = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    items: DropdownItem[],
    placeholder: string
  ) => (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">{placeholder}</option>
        {items.map((item) => (
          <option key={item.id} value={String(item.id)}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );

  const renderExportButton = (elementId: string, title: string) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportToPDF(elementId, title)}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export PDF
    </Button>
  );

  // ---------------------------------------------------------------------------
  // Tab content renderers
  // ---------------------------------------------------------------------------

  const renderStockSummary = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">All Combined Stock Report</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchStockSummary}>
            Refresh
          </Button>
          {renderExportButton("stock-summary-report", "Stock Summary")}
        </div>
      </div>
      <div id="stock-summary-report" className="space-y-6">
        <DataTable columns={stockColumns} data={stockData} searchKey="product" searchPlaceholder="Search products..." />
        {stockData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Stock Value by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockPieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(props) => {
                        const p = props as unknown as Record<string, unknown>;
                        const name = String(p.name ?? "");
                        const percent = Number(p.percent ?? 0);
                        return `${name} (${(percent * 100).toFixed(1)}%)`;
                      }}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stockPieData().map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => fmt(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderPurchaseInfo = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Purchase Info (Supplier-wise)</h3>
        {renderExportButton("purchase-info-report", "Purchase Info")}
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-4 flex-wrap">
            {renderDropdown(
              "Supplier",
              selectedSupplier,
              setSelectedSupplier,
              suppliers,
              "All Suppliers"
            )}
            <Button onClick={fetchPurchaseInfo}>Load Report</Button>
          </div>
        </CardContent>
      </Card>
      <div id="purchase-info-report" className="space-y-6">
        <DataTable
          columns={purchaseInfoColumns}
          data={purchaseInfoData}
          searchKey="invoiceNo"
          searchPlaceholder="Search invoices..."
        />
        {purchaseInfoData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Purchase Amount by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purchaseBarData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => fmt(Number(value))} />
                    <Legend />
                    <Bar dataKey="amount" name="Amount" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderPurchaseProduct = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Purchase Date &amp; Product-wise
        </h3>
        {renderExportButton(
          "purchase-product-report",
          "Purchase Product-wise"
        )}
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-4 flex-wrap">
            {renderDropdown(
              "Product",
              selectedProduct,
              setSelectedProduct,
              products,
              "All Products"
            )}
            <div className="space-y-1">
              <Label className="text-sm font-medium">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <Button onClick={fetchPurchaseProduct}>Load Report</Button>
          </div>
        </CardContent>
      </Card>
      <div id="purchase-product-report" className="space-y-6">
        <DataTable
          columns={purchaseProductColumns}
          data={purchaseProductData}
          searchKey="product"
          searchPlaceholder="Search products..."
        />
        {purchaseProductData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Purchase Total by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purchaseProductBarData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => fmt(Number(value))} />
                    <Legend />
                    <Bar dataKey="amount" name="Amount" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderBuyerIssues = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Buyer-wise Issue Details</h3>
        {renderExportButton("buyer-issue-report", "Buyer Issues")}
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-4 flex-wrap">
            {renderDropdown(
              "Buyer",
              selectedBuyer,
              setSelectedBuyer,
              buyers,
              "All Buyers"
            )}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Job No</Label>
              <Input
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
                placeholder="Enter job no..."
                className="w-[160px]"
              />
            </div>
            <Button onClick={fetchBuyerIssues}>Load Report</Button>
          </div>
        </CardContent>
      </Card>
      <div id="buyer-issue-report" className="space-y-6">
        <DataTable
          columns={buyerIssueColumns}
          data={buyerIssueData}
          searchKey="product"
          searchPlaceholder="Search products..."
        />
        {buyerIssueData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Issue Value by Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={buyerIssueBarData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => fmt(Number(value))} />
                    <Legend />
                    <Bar dataKey="total" name="Total Value" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderConsigneeIssues = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Consignee-wise Issue Details</h3>
        {renderExportButton("consignee-issue-report", "Consignee Issues")}
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-4 flex-wrap">
            {renderDropdown(
              "Consignee",
              selectedConsignee,
              setSelectedConsignee,
              consignees,
              "All Consignees"
            )}
            <Button onClick={fetchConsigneeIssues}>Load Report</Button>
          </div>
        </CardContent>
      </Card>
      <div id="consignee-issue-report">
        <DataTable
          columns={consigneeIssueColumns}
          data={consigneeIssueData}
          searchKey="product"
          searchPlaceholder="Search products..."
        />
      </div>
    </div>
  );

  const renderProductTracking = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product / Material Tracking</h3>
        {renderExportButton("product-tracking-report", "Product Tracking")}
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-4 flex-wrap">
            {renderDropdown(
              "Product",
              selectedProduct,
              setSelectedProduct,
              products,
              "Select Product"
            )}
            <Button onClick={fetchProductTracking}>Load Report</Button>
          </div>
        </CardContent>
      </Card>
      <div id="product-tracking-report">
        <DataTable
          columns={productTrackingColumns}
          data={productTrackingData}
          searchKey="type"
          searchPlaceholder="Search by type..."
        />
      </div>
    </div>
  );

  const renderTransport = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transport Report</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTransport}>
            Refresh
          </Button>
          {renderExportButton("transport-report", "Transport Report")}
        </div>
      </div>
      <div id="transport-report">
        <DataTable
          columns={transportColumns}
          data={transportData}
          searchKey="buyer"
          searchPlaceholder="Search buyers..."
        />
      </div>
    </div>
  );

  const renderReturns = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Buyer Return Report</h3>
        {renderExportButton("returns-report", "Buyer Returns")}
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-4 flex-wrap">
            {renderDropdown(
              "Buyer",
              selectedBuyer,
              setSelectedBuyer,
              buyers,
              "All Buyers"
            )}
            <Button onClick={fetchReturns}>Load Report</Button>
          </div>
        </CardContent>
      </Card>
      <div id="returns-report">
        <DataTable
          columns={returnColumns}
          data={returnData}
          searchKey="product"
          searchPlaceholder="Search products..."
        />
      </div>
    </div>
  );

  const renderHsnProducts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">HSN Product Details</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchHsnProducts}>
            Refresh
          </Button>
          {renderExportButton("hsn-report", "HSN Products")}
        </div>
      </div>
      <div id="hsn-report">
        <DataTable
          columns={hsnColumns}
          data={hsnData}
          searchKey="product"
          searchPlaceholder="Search products..."
        />
      </div>
    </div>
  );

  const renderSiteEvaluation = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Site Value Evaluation</h3>
        {renderExportButton("site-eval-report", "Site Evaluation")}
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-4 flex-wrap">
            {renderDropdown(
              "Buyer",
              selectedBuyer,
              setSelectedBuyer,
              buyers,
              "Select Buyer"
            )}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Job No</Label>
              <Input
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
                placeholder="Enter job no..."
                className="w-[160px]"
              />
            </div>
            <Button onClick={fetchSiteEvaluation}>Load Report</Button>
          </div>
        </CardContent>
      </Card>
      <div id="site-eval-report" className="space-y-4">
        <DataTable
          columns={siteEvalColumns}
          data={siteEvalData}
          searchKey="name"
          searchPlaceholder="Search..."
        />
        {siteEvalData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {fmt(siteEvalSummary.expencesTotal)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950">
                  <p className="text-sm text-muted-foreground">Total Returns</p>
                  <p className="text-2xl font-bold text-red-600">
                    {fmt(siteEvalSummary.returnsTotal)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <p className="text-sm text-muted-foreground">Net (Exp - Ret)</p>
                  <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {fmt(siteEvalSummary.grandTotal)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {fmt(siteEvalSummary.salesTotal)}
                  </p>
                </div>
              </div>
              <div className={`text-center p-5 rounded-lg border-2 ${siteEvalSummary.plTotal >= 0 ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700" : "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700"}`}>
                <p className="text-sm font-medium text-muted-foreground">Total P &amp; L</p>
                <p className={`text-3xl font-bold mt-1 ${siteEvalSummary.plTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {siteEvalSummary.plTotal >= 0 ? "" : "-"}{fmt(Math.abs(siteEvalSummary.plTotal))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Net (Exp - Ret) − Total Sales</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading report...</span>
        </div>
      );
    }

    switch (activeTab) {
      case "stock-summary":
        return renderStockSummary();
      case "purchase-info":
        return renderPurchaseInfo();
      case "purchase-product":
        return renderPurchaseProduct();
      case "buyer-issues":
        return renderBuyerIssues();
      case "consignee-issues":
        return renderConsigneeIssues();
      case "product-tracking":
        return renderProductTracking();
      case "transport":
        return renderTransport();
      case "returns":
        return renderReturns();
      case "hsn-products":
        return renderHsnProducts();
      case "site-evaluation":
        return renderSiteEvaluation();
      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">
          View and export inventory reports
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b">
        <div className="flex flex-wrap gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>{renderTabContent()}</div>
    </div>
  );
}
