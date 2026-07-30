"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Package,
  ShoppingCart,
  ArrowLeftRight,
  RotateCcw,
  TrendingDown,
  Truck,
  BarChart3,
  Users,
  FileText,
  Boxes,
  Factory,
  Building2,
  UserSquare2,
  ClipboardList,
  Wrench,
  Trash2,
  DollarSign,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  X,
  LogOut,
  Shield,
  FolderOpen,
  Layers,
  Ruler,
  Tag,
  Receipt,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const navSections: NavSection[] = [
  {
    title: "Masters",
    items: [
      { label: "Categories", href: "/masters/categories", icon: Tag },
      { label: "Sub-Categories", href: "/masters/subcategories", icon: Layers },
      { label: "Products", href: "/masters/products", icon: Package },
      { label: "Buyers", href: "/masters/buyers", icon: Building2 },
      { label: "Consignees", href: "/masters/consignees", icon: UserSquare2 },
      { label: "Suppliers", href: "/masters/suppliers", icon: Factory },
      { label: "Units", href: "/masters/units", icon: Ruler },
      { label: "Expense Types", href: "/masters/expense-types", icon: DollarSign },
    ],
  },
  {
    title: "Transactions",
    items: [
      { label: "Purchases", href: "/transactions/purchases", icon: ShoppingCart },
      { label: "Purchase Challans", href: "/transactions/purchase-challans", icon: FileText },
      { label: "Issues", href: "/transactions/issues", icon: ClipboardList },
      { label: "Sales", href: "/transactions/sales", icon: Receipt },
      { label: "Order Issues", href: "/transactions/order-issues", icon: Layers },
      { label: "Returns", href: "/transactions/returns", icon: RotateCcw },
      { label: "Return Repairs", href: "/transactions/return-repairs", icon: Wrench },
      { label: "Issue Transfers", href: "/transactions/issue-transfers", icon: ArrowLeftRight },
      { label: "Opening Stock", href: "/transactions/opening-stock", icon: FolderOpen },
      { label: "Losses", href: "/transactions/losses", icon: TrendingDown },
      { label: "Scraps", href: "/transactions/scraps", icon: Trash2 },
      { label: "Repairs", href: "/transactions/repairs", icon: Wrench },
      { label: "Transport", href: "/transactions/transport", icon: Truck },
      { label: "Expenses", href: "/transactions/expenses", icon: DollarSign },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Stock Summary", href: "/stock", icon: Boxes },
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Admin",
    adminOnly: true,
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Access Rights", href: "/admin/access-rights", icon: Shield },
    ],
  },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Masters: true,
    Transactions: true,
    Reports: true,
    Admin: true,
  });

  const userRole = (session?.user as { role?: string } | undefined)?.role;

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col transition-transform duration-300 lg:static lg:translate-x-0",
          "bg-[#0e1117] border-r border-white/[0.06]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo / Brand */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/30">
              <Boxes className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">ICL Inventory</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white/40 hover:text-white hover:bg-white/10 lg:hidden transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin">

          {/* Dashboard */}
          <Link
            href="/dashboard"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 mb-2",
              isActive("/dashboard")
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                : "text-white/50 hover:text-white/90 hover:bg-white/[0.06]"
            )}
          >
            <LayoutDashboard className={cn("h-4 w-4 shrink-0", isActive("/dashboard") ? "text-indigo-400" : "")} />
            Dashboard
          </Link>

          {/* Sections */}
          {navSections.map((section) => {
            if (section.adminOnly && userRole !== "ADMIN") return null;
            const isExpanded = expandedSections[section.title];

            return (
              <div key={section.title} className="mb-1">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/25 hover:text-white/40 transition-colors"
                >
                  {section.title}
                  {isExpanded
                    ? <ChevronDown className="h-3 w-3" />
                    : <ChevronRight className="h-3 w-3" />}
                </button>

                {isExpanded && (
                  <div className="mt-0.5 space-y-0.5">
                    {section.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-all duration-150",
                            active
                              ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-medium"
                              : "text-white/50 hover:text-white/90 hover:bg-white/[0.06] font-normal"
                          )}
                        >
                          <item.icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-indigo-400" : "")} />
                          <span className="truncate">{item.label}</span>
                          {active && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/30">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-white/80">
                {session?.user?.name ?? "User"}
              </p>
              <p className="truncate text-[10px] text-white/30">
                {userRole ?? "User"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-md p-1 text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
