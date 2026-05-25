"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Package,
  ShoppingCart,
  ClipboardList,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  productCount: number;
  purchaseCount: number;
  issueCount: number;
  stockValue: number;
}

interface RecentPurchase {
  id: number;
  invoiceNo: string;
  date: string;
  total: string;
  supplier: { name: string };
}

interface RecentIssue {
  id: number;
  date: string;
  total: string;
  buyer: { name: string };
  consignee: { name: string };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [recentIssues, setRecentIssues] = useState<RecentIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, purchasesRes, issuesRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/transactions/purchases?limit=5"),
          fetch("/api/transactions/issues?limit=5"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (purchasesRes.ok) {
          const purchasesData = await purchasesRes.json();
          setRecentPurchases(
            Array.isArray(purchasesData)
              ? purchasesData.slice(0, 5)
              : purchasesData.data
                ? purchasesData.data.slice(0, 5)
                : []
          );
        }

        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          setRecentIssues(
            Array.isArray(issuesData)
              ? issuesData.slice(0, 5)
              : issuesData.data
                ? issuesData.data.slice(0, 5)
                : []
          );
        }
      } catch {
        // Stats will show fallback values
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const statCards = [
    {
      title: "Total Products",
      value: stats ? stats.productCount.toLocaleString() : "--",
      description: "Registered products",
      icon: Package,
    },
    {
      title: "Total Purchases",
      value: stats ? stats.purchaseCount.toLocaleString() : "--",
      description: "Purchase entries",
      icon: ShoppingCart,
    },
    {
      title: "Total Issues",
      value: stats ? stats.issueCount.toLocaleString() : "--",
      description: "Items issued",
      icon: ClipboardList,
    },
    {
      title: "Stock Value",
      value: stats
        ? `₹${Number(stats.stockValue).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "--",
      description: "Current inventory value",
      icon: IndianRupee,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {session?.user?.name ?? "User"}
        </h2>
        <p className="text-muted-foreground">
          Here is an overview of your inventory system.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <span className="animate-pulse text-muted-foreground">
                    ...
                  </span>
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Purchases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : recentPurchases.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No recent purchases
              </p>
            ) : (
              <div className="space-y-3">
                {recentPurchases.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.invoiceNo}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.supplier?.name} -{" "}
                        {new Date(p.date).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      ₹{Number(p.total).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : recentIssues.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No recent issues
              </p>
            ) : (
              <div className="space-y-3">
                {recentIssues.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {i.buyer?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {i.consignee?.name} -{" "}
                        {new Date(i.date).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      ₹{Number(i.total).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
