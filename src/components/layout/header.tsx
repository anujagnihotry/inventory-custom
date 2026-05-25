"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut } from "lucide-react";

export function Header({
  onMenuToggle,
  title,
}: {
  onMenuToggle: () => void;
  title?: string;
}) {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <button
        onClick={onMenuToggle}
        className="rounded-md p-2 hover:bg-accent lg:hidden"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </button>

      <h1 className="text-lg font-semibold">{title ?? "Dashboard"}</h1>

      <div className="flex-1" />

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <span className="hidden text-sm font-medium sm:inline-block">
            {session?.user?.name ?? "User"}
          </span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session?.user?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email ?? ""}</p>
            </div>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
