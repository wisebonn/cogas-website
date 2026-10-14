"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useScrolled, useToast } from "@/lib/hooks";
import { Toast } from "@/components/Toast";
import { IMG } from "@/lib/images";

type Mode = "team" | "client";

export default function SignupPage() {
  const router = useRouter();
  const navScrolled = useScrolled(40);
  const { toastMsg, showToast } = useToast(3500);

  const [mode, setMode] = useState<Mode>("team");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: signUpErr, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: mode === "client" ? "client" : "member",
          },
        },
      });

      if (signUpErr) throw signUpErr;

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email,
          full_name: fullName || email,
          role: mode === "client" ? "client" : "member",
          is_approved: mode === "client" ? true : false,
          client_org: mode === "client" ? company : null,
        });
      }

      if (mode === "client") {
        showToast("Client account created! Redirecting to portal...");
        setTimeout(() => router.push("/client"), 900);
      } else {
        showToast(
          "Team account created! Await chair approval before accessing the portal."
        );
        setTimeout(() => router.push("/login"), 1200);
      }
    } catch (err: any) {
      setError(err.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className={`nav ${navScrolled ? "scrolled" : ""}`}>
        <div className="container nav-inner">
          <Link className="logo" href="/">
            <span className="logo-mark">CO</span>COGAs
          </Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/products">Products</Link>
            <Link href="/about">About</Link>
          </div>
          <Link className="btn btn-ghost" href="/login">
            Sign In
          </Link>
        </div>
      </nav>

      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "var(--cream)",
          paddingTop: 80,
        }}
        className="signup-shell"
      >
        {/* Left: photo */}
        <div
          style={{
            backgroundImage: `url(${IMG.heroField})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            padding: 48,
            color: "#fff",
          }}
          className="signup-photo"
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(4,23,14,.35) 0%, rgba(4,23,14,.85) 100%)",
            }}
          />
          <div style={{ position: "relative", zIndex: 2, maxWidth: 460 }}>
            <span className="eyebrow" style={{ color: "var(--lime)" }}>
              Join COGAs
            </span>
            <h2
              style={{
                color: "#fff",
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                marginTop: 16,
                lineHeight: 1.15,
              }}
            >
              Two paths. One family. Your choice.
            </h2>
            <p style={{ color: "rgba(255,255,255,.8)", marginTop: 14 }}>
              Team members join to run projects. Clients join to track theirs.
              Same platform, different doors.
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 40px",
          }}
        >
          <div style={{ width: "100%", maxWidth: 440 }}>
            <h2
              style={{
                fontFamily: "var(--font-head)",
                fontSize: "1.6rem",
                marginBottom: 6,
              }}
            >
              Create your account
            </h2>
            <p style={{ color: "var(--muted)", marginBottom: 22, fontSize: ".9rem" }}>
              Choose how you'd like to join.
            </p>

            {/* Mode toggle */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <button
                type="button"
                onClick={() => setMode("team")}
                style={{
                  padding: "14px 16px",
                  border: `1.5px solid ${mode === "team" ? "#a3e635" : "#e5e7eb"}`,
                  background: mode === "team" ? "rgba(163,230,53,.08)" : "#fafafa",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <b style={{ display: "block", fontSize: ".88rem", color: "#111" }}>
                  👔 Team
                </b>
                <small style={{ fontSize: ".72rem", color: "#777" }}>
                  Work on projects
                </small>
              </button>

              <button
                type="button"
                onClick={() => setMode("client")}
                style={{
                  padding: "14px 16px",
                  border: `1.5px solid ${mode === "client" ? "#a3e635" : "#e5e7eb"}`,
                  background: mode === "client" ? "rgba(163,230,53,.08)" : "#fafafa",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <b style={{ display: "block", fontSize: ".88rem", color: "#111" }}>
                  🤝 Client
                </b>
                <small style={{ fontSize: ".72rem", color: "#777" }}>
                  Track my projects
                </small>
              </button>
            </div>

            {error && (
              <div className="auth-error" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} style={{ display: "grid", gap: 14 }}>
              <input
                required
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
              />

              {mode === "client" && (
                <input
                  placeholder="Company / organisation (optional)"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  style={inputStyle}
                />
              )}

              <input
                required
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />

              <input
                required
                type="password"
                placeholder="Password (min 6 characters)"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />

              <button
                type="submit"
                className="btn btn-lime btn-block"
                style={{ justifyContent: "center", marginTop: 6 }}
                disabled={loading}
              >
                {loading
                  ? "Creating..."
                  : mode === "client"
                  ? "Create Client Account →"
                  : "Create Team Account →"}
              </button>
            </form>

            {mode === "team" && (
              <div
                className="info-banner"
                style={{ marginTop: 18, fontSize: ".75rem" }}
              >
                <b>ⓘ Approval required.</b> Team accounts are reviewed by the chair
                before access is granted.
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 22, fontSize: ".85rem", color: "var(--muted)" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                style={{ color: "var(--green-600)", fontWeight: 600 }}
              >
                Sign in →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .signup-shell {
            grid-template-columns: 1fr !important;
          }
          .signup-photo {
            min-height: 40vh;
          }
        }
      `}</style>

      <Toast message={toastMsg} />
    </>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "14px 15px",
  border: "1.5px solid #e5e7eb",
  borderRadius: 10,
  fontSize: ".95rem",
  fontFamily: "inherit",
  background: "#fafafa",
  outline: "none",
  transition: "all .15s ease",
};