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
  Settings,
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
  Menu,
  X,
  LogOut,
  Shield,
  FolderOpen,
  Layers,
  Ruler,
  Tag,
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
      { label: "Order Issues", href: "/transactions/order-issues", icon: Layers },
      { label: "Returns", href: "/transactions/returns", icon: RotateCcw },
      { label: "Return Repairs", href: "/transactions/return-repairs", icon: Wrench },
      { label: "Issue Transfers", href: "/transactions/issue-transfers", icon: ArrowLeftRight },
      { label: "Stock", href: "/transactions/opening-stock", icon: FolderOpen },
      { label: "Losses", href: "/transactions/losses", icon: TrendingDown },
      { label: "Scraps", href: "/transactions/scraps", icon: Trash2 },
      { label: "Repairs", href: "/transactions/repairs", icon: Wrench },
      { label: "Transport", href: "/transactions/transport", icon: Truck },
      { label: "Expenses", href: "/transactions/expenses", icon: DollarSign },
    ],
  },
  {
    title: "Other",
    items: [
      { label: "Stock", href: "/stock", icon: Boxes },
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
    Other: true,
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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Boxes className="h-5 w-5 text-primary" />
            <span>ICL Inventory</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {/* Dashboard link */}
          <Link
            href="/dashboard"
            onClick={onClose}
            className={cn(
              "mb-4 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive("/dashboard")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          {/* Sections */}
          {navSections.map((section) => {
            if (section.adminOnly && userRole !== "ADMIN") return null;

            const isExpanded = expandedSections[section.title];

            return (
              <div key={section.title} className="mb-2">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent"
                >
                  {section.title}
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-1 space-y-0.5">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium">
                {session?.user?.name ?? "User"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {userRole ?? "User"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
