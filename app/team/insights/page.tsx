"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/hooks";
import { EmptyState } from "@/components/EmptyState";

export default function InsightsPage() {
  const { isApprover } = useProfile();
  const [tasks, setTasks] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [leave, setLeave] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [t, i, e, c, en, l] = await Promise.all([
        supabase.from("tasks").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("clients").select("*"),
        supabase.from("enquiries").select("*"),
        supabase.from("leave_requests").select("*"),
      ]);
      setTasks(t.data || []);
      setInvoices(i.data || []);
      setExpenses(e.data || []);
      setClients(c.data || []);
      setEnquiries(en.data || []);
      setLeave(l.data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (!isApprover) {
    return (
      <div className="panel" style={{ marginTop: 0 }}>
        <EmptyState dark icon="🔒" title="Approver access only" description="Insights are visible to chair and co-chair." />
      </div>
    );
  }

  if (loading) return null;

  const revenue = invoices.filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.total), 0);
  const outstanding = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").reduce((a, i) => a + Number(i.total), 0);
  const expenseTotal = expenses.filter((e) => e.status === "approved").reduce((a, e) => a + Number(e.amount), 0);
  const profit = revenue - expenseTotal;
  const winRate = (() => {
    const closed = enquiries.filter((e) => ["won", "lost"].includes(e.stage));
    const won = closed.filter((e) => e.stage === "won");
    return closed.length === 0 ? 0 : Math.round((won.length / closed.length) * 100);
  })();

  const completionRate = tasks.length === 0 ? 0 : Math.round((tasks.filter((t) => t.status === "complete").length / tasks.length) * 100);
  const attentionRate = tasks.length === 0 ? 0 : Math.round((tasks.filter((t) => t.needs_attention).length / tasks.length) * 100);

  // Tasks by status
  const byStatus: Record<string, number> = {};
  tasks.forEach((t) => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });

  // Revenue by month (last 6)
  const monthlyRevenue: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();
    const total = invoices.filter((inv) => {
      if (inv.status !== "paid" || !inv.paid_at) return false;
      const pd = new Date(inv.paid_at);
      return pd.getMonth() === m && pd.getFullYear() === y;
    }).reduce((a, inv) => a + Number(inv.total), 0);
    monthlyRevenue.push({ label: d.toLocaleDateString("en-KE", { month: "short" }), value: total });
  }
  const maxRev = Math.max(...monthlyRevenue.map((m) => m.value), 1);

  return (
    <div>
      <div className="mgmt-panel">
        <h2>📊 Business Insights</h2>
        <p className="mgmt-subtitle">Live metrics across finance, sales and delivery.</p>
        <div className="mgmt-kpis">
          <div className="mgmt-kpi good"><span>Revenue</span><b>KSh {(revenue / 1000).toFixed(1)}K</b></div>
          <div className="mgmt-kpi warning"><span>Outstanding</span><b>KSh {(outstanding / 1000).toFixed(1)}K</b></div>
          <div className="mgmt-kpi alert"><span>Expenses</span><b>KSh {(expenseTotal / 1000).toFixed(1)}K</b></div>
          <div className="mgmt-kpi good"><span>Net profit</span><b>KSh {(profit / 1000).toFixed(1)}K</b></div>
          <div className="mgmt-kpi good"><span>Win rate</span><b>{winRate}%</b></div>
          <div className="mgmt-kpi"><span>Clients</span><b>{clients.length}</b></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
        <div className="panel">
          <h3>💰 Revenue — last 6 months</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, padding: "16px 0" }}>
            {monthlyRevenue.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: ".72rem", color: "#a3e635", fontWeight: 600 }}>{(m.value / 1000).toFixed(0)}K</div>
                <div style={{ width: "100%", height: `${(m.value / maxRev) * 130}px`, minHeight: 3, background: "linear-gradient(180deg,#a3e635,#65a30d)", borderRadius: 4 }} />
                <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.5)" }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>✅ Task health</h3>
          <div style={{ marginTop: 20 }}>
            <KpiBar label="Completed" value={completionRate} color="#a3e635" />
            <KpiBar label="Needs attention" value={attentionRate} color="#f87171" />
            <div style={{ marginTop: 22 }}>
              {Object.entries(byStatus).map(([status, count]) => (
                <div key={status} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.05)", fontSize: ".82rem" }}>
                  <span style={{ textTransform: "capitalize", color: "rgba(255,255,255,.7)" }}>{status.replace("_", " ")}</span>
                  <b style={{ color: "#fff" }}>{count}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <h3>🤝 Sales pipeline</h3>
          <div style={{ marginTop: 16 }}>
            {["new", "contacted", "qualified", "proposal_sent", "won", "lost"].map((stage) => {
              const count = enquiries.filter((e) => e.stage === stage).length;
              const pct = enquiries.length === 0 ? 0 : (count / enquiries.length) * 100;
              return (
                <div key={stage} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", color: "rgba(255,255,255,.6)", marginBottom: 4 }}>
                    <span style={{ textTransform: "capitalize" }}>{stage.replace("_", " ")}</span>
                    <span>{count}</span>
                  </div>
                  <div className="bar" style={{ background: "rgba(255,255,255,.08)" }}>
                    <i style={{ width: `${pct}%`, background: stage === "won" ? "#a3e635" : stage === "lost" ? "#f87171" : undefined }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <h3>🌴 Team & leave</h3>
          <div className="kpi-grid" style={{ marginTop: 12, gridTemplateColumns: "1fr 1fr" }}>
            <div className="kpi" style={{ padding: 14 }}>
              <span>Pending leave</span>
              <b>{leave.filter((l) => l.status === "pending").length}</b>
            </div>
            <div className="kpi" style={{ padding: 14 }}>
              <span>Approved this year</span>
              <b>
                {leave.filter((l) => l.status === "approved" && new Date(l.start_date).getFullYear() === new Date().getFullYear()).length}
              </b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", color: "rgba(255,255,255,.7)", marginBottom: 6 }}>
        <span>{label}</span>
        <b style={{ color }}>{value}%</b>
      </div>
      <div className="bar" style={{ background: "rgba(255,255,255,.08)", height: 8 }}>
        <i style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}