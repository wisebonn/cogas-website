"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface AuthGuardProps {
  children: ReactNode;
  /** Which role this route requires */
  requiredRole?: "team" | "client" | "approver";
  /** Redirect target if unauth (default /login) */
  redirectTo?: string;
  /** Loading fallback */
  loadingFallback?: ReactNode;
  /** Called with session + profile once loaded */
  onReady?: (data: {
    userId: string;
    userEmail: string;
    profile: any;
  }) => void;
}

export function AuthGuard({
  children,
  requiredRole = "team",
  redirectTo = "/login",
  loadingFallback,
  onReady,
}: AuthGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace(redirectTo);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      // Role enforcement
      if (requiredRole === "client" && profile?.role !== "client") {
        router.replace("/team");
        return;
      }

      if (
        requiredRole === "team" &&
        profile?.role === "client"
      ) {
        router.replace("/client");
        return;
      }

      if (
        requiredRole === "approver" &&
        !["chair", "cochair"].includes(profile?.role || "")
      ) {
        router.replace("/team");
        return;
      }

      if (onReady) {
        onReady({
          userId: session.user.id,
          userEmail: session.user.email || "",
          profile,
        });
      }

      setReady(true);
    };

    check();
  }, [router, requiredRole, redirectTo, onReady]);

  if (!ready) {
    return (
      <>
        {loadingFallback || (
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
              Loading...
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}