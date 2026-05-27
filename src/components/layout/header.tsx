"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu, LogOut, ChevronRight, Bell } from "lucide-react";

function getBreadcrumb(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg) =>
    seg
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function Header({
  onMenuToggle,
}: {
  onMenuToggle: () => void;
  title?: string;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const crumbs = getBreadcrumb(pathname);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-white/80 backdrop-blur-md px-4 sm:px-6 shadow-sm">
      {/* Mobile menu */}
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        {crumbs.length === 0 ? (
          <span className="font-semibold text-foreground">Dashboard</span>
        ) : (
          crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
              <span
                className={
                  i === crumbs.length - 1
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }
              >
                {crumb}
              </span>
            </span>
          ))
        )}
      </nav>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-semibold text-white shadow-sm">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-none text-foreground">
                {session?.user?.name ?? "User"}
              </p>
              <p className="text-[10px] leading-none text-muted-foreground mt-0.5">
                {(session?.user as { role?: string })?.role ?? "User"}
              </p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-border/60 bg-white p-1.5 shadow-xl shadow-black/10">
              <div className="px-2.5 py-2 mb-1">
                <p className="text-sm font-semibold text-foreground">{session?.user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{session?.user?.email ?? ""}</p>
              </div>
              <div className="h-px bg-border/60 mx-1 mb-1" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center rounded-lg px-2.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
