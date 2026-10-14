"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { PortalLayout } from "@/components/PortalLayout";
import { NotificationBell } from "@/components/NotificationBell";

const TITLES: Record<string, string> = {
  "/team": "Dashboard",
  "/team/tasks": "Tasks & Projects",
  "/team/projects": "Projects",
  "/team/clients": "Clients",
  "/team/enquiries": "Enquiries",
  "/team/proposals": "Proposals",
  "/team/invoices": "Invoices",
  "/team/expenses": "Expenses",
  "/team/cashflow": "Cash Flow",
  "/team/compliance": "Compliance Calendar",
  "/team/people": "Team & People",
  "/team/leave": "Leave Requests",
  "/team/payroll": "Payroll",
  "/team/meetings": "Meetings & Calls",
  "/team/messages": "Messages",
  "/team/docs": "Document Vault",
  "/team/agrimind": "AgriMind Knowledge Base",
  "/team/insights": "Insights & Control",
  "/team/settings": "Settings",
};

export default function TeamLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("member");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      setUserEmail(session.user.email || "");
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_approved, role")
        .eq("id", session.user.id)
        .single();

      // Clients get redirected to their own portal
      if (profile?.role === "client") {
        router.replace("/client");
        return;
      }

      if (!profile?.is_approved) {
        // Render a pending-approval screen instead of the layout
        setReady(true);
        setUserRole(profile?.role || "member");
        return;
      }

      setUserRole(profile?.role || "member");
      setReady(true);
    };
    check();
  }, [router]);

  // Not approved — show pending screen
  if (ready && userRole !== "chair" && userRole !== "cochair" && userRole !== "member" && userRole !== "consultant" && userRole !== "intern") {
    return null;
  }

  // Loading state
  if (!ready) {
    return (
      <div
        style={{
          color: "#fff",
          background: "#0a0a0a",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-body)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>🌱</div>
          Loading Team Portal...
        </div>
      </div>
    );
  }

  const title = TITLES[pathname || "/team"] || "Dashboard";

  return (
    <PortalLayout
      userEmail={userEmail}
      userRole={userRole}
      title={title}
      topbarRight={<NotificationBell userEmail={userEmail} />}
    >
      {children}
    </PortalLayout>
  );
}