"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Package,
  ShoppingCart,
  ClipboardList,
  IndianRupee,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

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

const statCards = (stats: DashboardStats | null, loading: boolean) => [
  {
    title: "Total Products",
    value: stats ? stats.productCount.toLocaleString() : "—",
    description: "Registered in masters",
    icon: Package,
    color: "indigo",
    href: "/masters/products",
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-500",
    text: "text-indigo-600",
    border: "border-indigo-100",
  },
  {
    title: "Total Purchases",
    value: stats ? stats.purchaseCount.toLocaleString() : "—",
    description: "Purchase entries",
    icon: ShoppingCart,
    color: "emerald",
    href: "/transactions/purchases",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-500",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
  {
    title: "Total Issues",
    value: stats ? stats.issueCount.toLocaleString() : "—",
    description: "Items issued out",
    icon: ClipboardList,
    color: "amber",
    href: "/transactions/issues",
    bg: "bg-amber-50",
    iconBg: "bg-amber-500",
    text: "text-amber-600",
    border: "border-amber-100",
  },
  {
    title: "Stock Value",
    value: stats
      ? `₹${Number(stats.stockValue).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : "—",
    description: "Current inventory value",
    icon: IndianRupee,
    color: "violet",
    href: "/stock",
    bg: "bg-violet-50",
    iconBg: "bg-violet-500",
    text: "text-violet-600",
    border: "border-violet-100",
  },
];

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
        if (statsRes.ok) setStats(await statsRes.json());
        if (purchasesRes.ok) {
          const d = await purchasesRes.json();
          setRecentPurchases((Array.isArray(d) ? d : d.data ?? []).slice(0, 5));
        }
        if (issuesRes.ok) {
          const d = await issuesRes.json();
          setRecentIssues((Array.isArray(d) ? d : d.data ?? []).slice(0, 5));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-6 text-white shadow-lg shadow-indigo-500/20">
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm font-medium">{greeting} 👋</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            {session?.user?.name ?? "User"}
          </h2>
          <p className="mt-1 text-indigo-200 text-sm">
            Here&apos;s what&apos;s happening with your inventory today.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -right-4 h-52 w-52 rounded-full bg-white/5" />
        <TrendingUp className="absolute bottom-4 right-6 h-20 w-20 text-white/10" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards(stats, loading).map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`group relative overflow-hidden rounded-xl border ${card.border} ${card.bg} p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {card.title}
                </p>
                <p className={`mt-2 text-2xl font-bold ${card.text}`}>
                  {loading ? (
                    <span className="inline-block h-7 w-20 animate-pulse rounded bg-current/10" />
                  ) : (
                    card.value
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
              </div>
              <div className={`rounded-xl p-2.5 ${card.iconBg} shadow-sm`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <ArrowRight className={`absolute bottom-4 right-4 h-4 w-4 ${card.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Recent Purchases */}
        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold">Recent Purchases</h3>
            </div>
            <Link href="/transactions/purchases" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : recentPurchases.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No recent purchases</p>
            ) : (
              recentPurchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.invoiceNo}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.supplier?.name} · {new Date(p.date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    ₹{Number(p.total).toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Issues */}
        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <h3 className="text-sm font-semibold">Recent Issues</h3>
            </div>
            <Link href="/transactions/issues" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : recentIssues.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No recent issues</p>
            ) : (
              recentIssues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{issue.buyer?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {issue.consignee?.name} · {new Date(issue.date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    ₹{Number(issue.total).toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
