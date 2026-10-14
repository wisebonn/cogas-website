"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ClientLayout } from "@/components/ClientLayout";

const TITLES: Record<string, string> = {
  "/client": "Overview",
  "/client/projects": "My Projects",
  "/client/documents": "Documents",
  "/client/invoices": "Invoices",
  "/client/messages": "Messages",
  "/client/agrimind": "AgriMind",
};

export default function ClientRootLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login?mode=client"); return; }
      setUserEmail(session.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, client_org")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "client") { router.replace("/team"); return; }
      setClientName(profile.full_name || profile.client_org || "Client");
      setReady(true);
    };
    check();
  }, [router]);

  if (!ready) {
    return (
      <div style={{ color: "#fff", background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-body)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>🌱</div>
          Loading Client Portal...
        </div>
      </div>
    );
  }

  return (
    <ClientLayout userEmail={userEmail} clientName={clientName} title={TITLES[pathname || "/client"] || "Overview"}>
      {children}
    </ClientLayout>
  );
}