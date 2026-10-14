"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CashflowPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState(90); // days

  useEffect(() => {
    const load = async () => {
      const [invRes, expRes] = await Promise.all([
        supabase.from("invoices").select("*"),
        supabase.from("expenses").select("*"),
      ]);
      setInvoices(invRes.data || []);
      setExpenses(expRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build daily buckets
  const days: {
    date: Date;
    incoming: number;
    outgoing: number;
    net: number;
    cumulative: number;
  }[] = [];

  let cumulative = 0;
  for (let i = 0; i < horizon; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);

    const incoming = invoices
      .filter((inv) => {
        if (inv.status === "paid") return false;
        if (!inv.due_date) return false;
        const due = new Date(inv.due_date);
        due.setHours(0, 0, 0, 0);
        return due.getTime() === d.getTime();
      })
      .reduce((a, inv) => a + Number(inv.total), 0);

    const outgoing = expenses
      .filter((e) => {
        const incurred = new Date(e.incurred_on);
        incurred.setHours(0, 0, 0, 0);
        return incurred.getTime() === d.getTime();
      })
      .reduce((a, e) => a + Number(e.amount), 0);

    cumulative += incoming - outgoing;

    days.push({
      date: d,
      incoming,
      outgoing,
      net: incoming - outgoing,
      cumulative,
    });
  }

  const totalIn = days.reduce((a, d) => a + d.incoming, 0);
  const totalOut = days.reduce((a, d) => a + d.outgoing, 0);
  const netFlow = totalIn - totalOut;

  const maxAbs = Math.max(
    ...days.map((d) => Math.abs(d.cumulative)),
    1000
  );

  return (
    <div>
      <div className="kpi-grid" style={{ marginTop: 0 }}>
        <div className="kpi">
          <span>Expected in ({horizon}d)</span>
          <b>KSh {(totalIn / 1000).toFixed(1)}K</b>
          <small className="up">Pending invoices</small>
        </div>
        <div className="kpi">
          <span>Expected out ({horizon}d)</span>
          <b>KSh {(totalOut / 1000).toFixed(1)}K</b>
          <small className="down">Logged expenses</small>
        </div>
        <div className="kpi">
          <span>Net flow</span>
          <b style={{ color: netFlow >= 0 ? "#a3e635" : "#f87171" }}>
            KSh {(netFlow / 1000).toFixed(1)}K
          </b>
          <small>{netFlow >= 0 ? "Positive" : "Negative"}</small>
        </div>
        <div className="kpi">
          <span>Horizon</span>
          <b>{horizon} days</b>
          <small>Adjustable below</small>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>📈 Cumulative cash position</h3>
          <div className="filter-tabs" style={{ margin: 0, border: "none", padding: 0 }}>
            {[30, 60, 90, 180].map((h) => (
              <button
                key={h}
                className={`filter-tab ${horizon === h ? "active" : ""}`}
                onClick={() => setHorizon(h)}
              >
                {h} days
              </button>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            height: 200,
            padding: "10px 0",
            borderTop: "1px solid rgba(255,255,255,.06)",
            borderBottom: "1px solid rgba(255,255,255,.06)",
          }}
        >
          {days.map((d, i) => {
            const pct = (d.cumulative / maxAbs) * 100;
            const isPositive = pct >= 0;
            const height = Math.min(Math.abs(pct), 100);
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  position: "relative",
                }}
                title={`${d.date.toLocaleDateString()}: KSh ${d.cumulative.toLocaleString()}`}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: 1,
                    background: "rgba(255,255,255,.1)",
                  }}
                />
                <div
                  style={{
                    position: isPositive ? "absolute" : "absolute",
                    [isPositive ? "bottom" : "top"]: "50%",
                    left: "10%",
                    right: "10%",
                    height: `${height / 2}%`,
                    background: isPositive
                      ? "linear-gradient(180deg, #a3e635, #65a30d)"
                      : "linear-gradient(0deg, #f87171, #dc2626)",
                    borderRadius: 2,
                    minHeight: 2,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: ".72rem",
            color: "rgba(255,255,255,.5)",
            marginTop: 10,
          }}
        >
          <span>Today</span>
          <span>+{Math.floor(horizon / 2)} days</span>
          <span>+{horizon} days</span>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3>📅 Key dates</h3>
        {days.filter((d) => d.incoming > 0 || d.outgoing > 0).length === 0 ? (
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".85rem" }}>
            No scheduled in/outflows in this horizon. Add invoices with due dates
            and expenses to see them here.
          </p>
        ) : (
          <div style={{ marginTop: 14 }}>
            {days
              .filter((d) => d.incoming > 0 || d.outgoing > 0)
              .slice(0, 12)
              .map((d, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(255,255,255,.05)",
                    fontSize: ".85rem",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,.75)" }}>
                    {d.date.toLocaleDateString("en-KE", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span style={{ display: "flex", gap: 16 }}>
                    {d.incoming > 0 && (
                      <span style={{ color: "#a3e635" }}>
                        +KSh {d.incoming.toLocaleString()}
                      </span>
                    )}
                    {d.outgoing > 0 && (
                      <span style={{ color: "#f87171" }}>
                        −KSh {d.outgoing.toLocaleString()}
                      </span>
                    )}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}