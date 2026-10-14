"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast } from "@/lib/hooks";
import { EmptyInvoices } from "@/components/EmptyState";
import { ComingSoonButton } from "@/components/ComingSoon";
import { Toast } from "@/components/Toast";

export default function ClientInvoicesPage() {
  const { userEmail } = useProfile();
  const { toastMsg, showToast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    const load = async () => {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_email", userEmail)
        .order("created_at", { ascending: false });
      setInvoices(data || []);
      setLoading(false);
    };
    load();
  }, [userEmail]);

  if (loading) return null;

  const outstanding = invoices.filter((i) => i.status !== "paid").reduce((a, i) => a + Number(i.total), 0);
  const paid = invoices.filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.total), 0);

  return (
    <div>
      <div className="kpi-grid" style={{ marginTop: 0 }}>
        <div className="kpi">
          <span>Total invoices</span>
          <b>{invoices.length}</b>
        </div>
        <div className="kpi">
          <span>Paid</span>
          <b>KSh {(paid / 1000).toFixed(1)}K</b>
          <small className="up">Settled</small>
        </div>
        <div className="kpi">
          <span>Outstanding</span>
          <b>KSh {(outstanding / 1000).toFixed(1)}K</b>
          <small className={outstanding > 0 ? "down" : "up"}>{invoices.filter((i) => i.status !== "paid").length} unpaid</small>
        </div>
        <div className="kpi">
          <span>Next due</span>
          <b style={{ fontSize: "1rem", marginTop: 8 }}>
            {invoices.filter((i) => i.status !== "paid" && i.due_date).length > 0
              ? new Date(invoices.filter((i) => i.status !== "paid" && i.due_date).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0].due_date).toLocaleDateString("en-KE", { day: "numeric", month: "short" })
              : "None"}
          </b>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="panel" style={{ marginTop: 20 }}>
          <EmptyInvoices />
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 20, padding: 0 }}>
          <div style={{ padding: "20px 22px 8px" }}>
            <h3 style={{ margin: 0 }}>🧾 Your invoices</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr><th>Invoice</th><th>Project</th><th>Amount</th><th>Due</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600, color: "#fff" }}>{i.invoice_number}</td>
                    <td style={{ fontSize: ".82rem" }}>{i.project_name || "---"}</td>
                    <td style={{ fontSize: ".9rem", color: "#a3e635", fontWeight: 600 }}>
                      {i.currency} {Number(i.total).toLocaleString()}
                    </td>
                    <td style={{ fontSize: ".8rem" }}>{i.due_date ? new Date(i.due_date).toLocaleDateString("en-KE", { dateStyle: "short" }) : "---"}</td>
                    <td>
                      <span className={`pill ${i.status === "paid" ? "pill-green" : "pill-gold"}`}>{i.status}</span>
                    </td>
                    <td>
                      {i.status !== "paid" && (
                        <ComingSoonButton
                          feature="Online payment"
                          description="Pay with M-Pesa or card directly from your portal. Coming soon — your consultant will send payment instructions in the meantime."
                          className="btn btn-lime"
                          label="Pay"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}