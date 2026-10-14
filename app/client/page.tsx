"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/hooks";
import { IMG } from "@/lib/images";

export default function ClientOverview() {
  const { userEmail } = useProfile();
  const [tasks, setTasks] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    const load = async () => {
      const [t, i, m] = await Promise.all([
        supabase.from("tasks").select("*").eq("client_email", userEmail),
        supabase.from("invoices").select("*").eq("client_email", userEmail),
        supabase.from("meetings").select("*").eq("client_email", userEmail).gte("starts_at", new Date().toISOString()).order("starts_at").limit(5),
      ]);
      setTasks(t.data || []);
      setInvoices(i.data || []);
      setMeetings(m.data || []);
      setLoading(false);
    };
    load();
  }, [userEmail]);

  if (loading) return null;

  const active = tasks.filter((t) => t.status !== "complete");
  const complete = tasks.filter((t) => t.status === "complete");
  const outstanding = invoices.filter((i) => i.status !== "paid").reduce((a, i) => a + Number(i.total), 0);
  const upcoming = meetings[0];

  return (
    <div>
      <div
        className="module-hero"
        style={{ backgroundImage: `url(${IMG.heroField})`, minHeight: 200 }}
      >
        <div>
          <h2>Welcome back 👋</h2>
          <p>Here's what's happening with your projects today.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginTop: 0 }}>
        <div className="kpi">
          <span>Active tasks</span>
          <b>{active.length}</b>
          <small className="up">In progress</small>
        </div>
        <div className="kpi">
          <span>Completed</span>
          <b>{complete.length}</b>
          <small>Delivered</small>
        </div>
        <div className="kpi">
          <span>Outstanding</span>
          <b>KSh {(outstanding / 1000).toFixed(1)}K</b>
          <small className={outstanding > 0 ? "down" : "up"}>
            {invoices.filter((i) => i.status !== "paid").length} invoices
          </small>
        </div>
        <div className="kpi">
          <span>Next meeting</span>
          <b style={{ fontSize: "1rem", marginTop: 8 }}>
            {upcoming
              ? new Date(upcoming.starts_at).toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "None"}
          </b>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>🎯 Active milestones</h3>
          {active.length === 0 && (
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".85rem", marginTop: 12 }}>
              All caught up.
            </p>
          )}
          {active.slice(0, 5).map((t) => (
            <div key={t.id} className="meet">
              <div style={{ flex: 1 }}>
                <b>{t.title}</b>
                <small>{t.project_name || t.department} · {t.status.replace("_", " ")}</small>
              </div>
              <span className="pill pill-gold">{t.status}</span>
            </div>
          ))}
          <Link href="/client/projects" className="btn btn-ghost btn-block" style={{ marginTop: 14, justifyContent: "center" }}>
            View all projects →
          </Link>
        </div>

        <div className="panel">
          <h3>💰 Recent invoices</h3>
          {invoices.length === 0 && (
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".85rem", marginTop: 12 }}>
              No invoices yet.
            </p>
          )}
          {invoices.slice(0, 4).map((i) => (
            <div key={i.id} className="meet">
              <div style={{ flex: 1 }}>
                <b>{i.invoice_number}</b>
                <small>Due {i.due_date ? new Date(i.due_date).toLocaleDateString("en-KE", { dateStyle: "short" }) : "---"}</small>
              </div>
              <span className={`pill ${i.status === "paid" ? "pill-green" : "pill-gold"}`}>
                {i.currency} {Number(i.total).toLocaleString()}
              </span>
            </div>
          ))}
          <Link href="/client/invoices" className="btn btn-ghost btn-block" style={{ marginTop: 14, justifyContent: "center" }}>
            All invoices →
          </Link>
        </div>
      </div>
    </div>
  );
}