"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles?: ("chair" | "cochair" | "member" | "consultant" | "intern")[];
}

const NAV: NavItem[] = [
  { href: "/team", label: "Dashboard", icon: "🏠" },
  { href: "/team/tasks", label: "Tasks & Projects", icon: "✅" },
  { href: "/team/projects", label: "Projects", icon: "🗂" },
  { href: "/team/clients", label: "Clients", icon: "🤝" },
  { href: "/team/enquiries", label: "Enquiries", icon: "📨" },
  { href: "/team/proposals", label: "Proposals", icon: "📝" },
  { href: "/team/invoices", label: "Invoices", icon: "🧾" },
  { href: "/team/expenses", label: "Expenses", icon: "💸" },
  { href: "/team/cashflow", label: "Cash Flow", icon: "📈" },
  { href: "/team/compliance", label: "Compliance", icon: "⚖️" },
  { href: "/team/people", label: "Team", icon: "👥" },
  { href: "/team/leave", label: "Leave", icon: "🌴" },
  { href: "/team/payroll", label: "Payroll", icon: "💰", roles: ["chair", "cochair"] },
  { href: "/team/meetings", label: "Meetings", icon: "📅" },
  { href: "/team/messages", label: "Messages", icon: "💬" },
  { href: "/team/docs", label: "Documents", icon: "📁" },
  { href: "/team/agrimind", label: "AgriMind", icon: "🌿" },
  { href: "/team/insights", label: "Insights", icon: "📊", roles: ["chair", "cochair"] },
  { href: "/team/settings", label: "Settings", icon: "⚙️", roles: ["chair", "cochair"] },
];

interface PortalLayoutProps {
  children: ReactNode;
  userEmail: string;
  userRole: string;
  topbarRight?: ReactNode;
  title?: string;
}

export function PortalLayout({
  children,
  userEmail,
  userRole,
  topbarRight,
  title,
}: PortalLayoutProps) {
  const pathname = usePathname();

  const visibleNav = NAV.filter(
    (item) => !item.roles || item.roles.includes(userRole as any)
  );

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
            &nbsp;Portal
          </span>
        </Link>

        {visibleNav.map((item) => {
          const active =
            item.href === "/team"
              ? pathname === "/team"
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
          <h1>{title || "Dashboard"}</h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {topbarRight}
            <span style={{ fontSize: ".85rem", color: "rgba(255,255,255,.6)" }}>
              👋 <b style={{ color: "#fff" }}>{userEmail}</b>
              <span
                className={`role-badge ${
                  userRole === "chair"
                    ? "role-chair"
                    : userRole === "cochair"
                    ? "role-cochair"
                    : "role-member"
                }`}
              >
                {userRole}
              </span>
            </span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}