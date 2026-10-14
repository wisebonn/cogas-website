"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV: NavItem[] = [
  { href: "/client", label: "Overview", icon: "🏠" },
  { href: "/client/projects", label: "My Projects", icon: "🗂" },
  { href: "/client/documents", label: "Documents", icon: "📄" },
  { href: "/client/invoices", label: "Invoices", icon: "🧾" },
  { href: "/client/messages", label: "Messages", icon: "💬" },
  { href: "/client/agrimind", label: "AgriMind", icon: "🌿" },
];

interface ClientLayoutProps {
  children: ReactNode;
  userEmail: string;
  clientName: string;
  topbarRight?: ReactNode;
  title?: string;
}

export function ClientLayout({
  children,
  userEmail,
  clientName,
  topbarRight,
  title,
}: ClientLayoutProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="portal-shell">
      <aside className="sidebar">
        <Link className="logo" href="/">
          <span className="logo-mark">CO</span>COGAs
          <span style={{ fontWeight: 400, opacity: 0.6, fontSize: ".8rem" }}>
            &nbsp;Client
          </span>
        </Link>

        {NAV.map((item) => {
          const active =
            item.href === "/client"
              ? pathname === "/client"
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`snav ${active ? "active" : ""}`}
            >
              <span style={{ width: 20, display: "inline-block" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}

        <button
          className="snav"
          style={{ marginTop: "auto", color: "#f87171" }}
          onClick={handleLogout}
        >
          <span style={{ width: 20, display: "inline-block" }}>🚪</span>
          Log Out
        </button>
      </aside>

      <main className="main">
        <div className="topbar">
          <h1>{title || `Welcome, ${clientName}`}</h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {topbarRight}
            <span style={{ fontSize: ".85rem", color: "rgba(255,255,255,.6)" }}>
              {userEmail}
            </span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}