"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/lib/hooks";
import { EmptyState } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";

interface Proposal {
  id: string;
  client_name: string | null;
  title: string;
  scope: string | null;
  deliverables: string | null;
  timeline_weeks: number | null;
  amount: number | null;
  currency: string | null;
  status: string;
  valid_until: string | null;
  created_at: string;
}

const STATUSES = ["draft", "sent", "accepted", "rejected", "expired"];

export default function ProposalsPage() {
  const { toastMsg, showToast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    title: "",
    scope: "",
    deliverables: "",
    timeline_weeks: 4,
    amount: 0,
    currency: "KES",
    valid_until: "",
  });

  const load = async () => {
    const { data } = await supabase
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false });
    setProposals((data as Proposal[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.title.trim()) return showToast("Title required");
    if (!form.client_name.trim()) return showToast("Client name required");
    const { error } = await supabase.from("proposals").insert({
      client_name: form.client_name,
      title: form.title,
      scope: form.scope || null,
      deliverables: form.deliverables || null,
      timeline_weeks: Number(form.timeline_weeks) || null,
      amount: Number(form.amount) || null,
      currency: form.currency,
      valid_until: form.valid_until || null,
      status: "draft",
    });
    if (error) return showToast("Error: " + error.message);
    setShowNew(false);
    setForm({
      client_name: "",
      title: "",
      scope: "",
      deliverables: "",
      timeline_weeks: 4,
      amount: 0,
      currency: "KES",
      valid_until: "",
    });
    load();
    showToast("Proposal created ✓");
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("proposals").update({ status }).eq("id", id);
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
    showToast(`Proposal → ${status}`);
  };

  if (loading) return null;

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: ".85rem", color: "rgba(255,255,255,.6)" }}>
          {proposals.length} proposals ·{" "}
          {proposals.filter((p) => p.status === "sent").length} awaiting response
        </div>
        <button className="btn btn-lime" onClick={() => setShowNew(true)}>
          ＋ New Proposal
        </button>
      </div>

      {proposals.length === 0 ? (
        <div className="panel" style={{ marginTop: 0 }}>
          <EmptyState
            dark
            icon="📝"
            title="No proposals yet"
            description="Generate a quote from any client enquiry or create one manually here."
          />
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 0, padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Timeline</th>
                  <th>Status</th>
                  <th>Valid until</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>
                        {p.title}
                      </div>
                      {p.scope && (
                        <small style={{ color: "rgba(255,255,255,.5)" }}>
                          {p.scope.slice(0, 60)}
                          {p.scope.length > 60 ? "..." : ""}
                        </small>
                      )}
                    </td>
                    <td style={{ fontSize: ".85rem" }}>{p.client_name || "---"}</td>
                    <td style={{ fontSize: ".85rem", color: "#a3e635" }}>
                      {p.amount
                        ? `${p.currency || "KES"} ${Number(p.amount).toLocaleString()}`
                        : "---"}
                    </td>
                    <td style={{ fontSize: ".82rem" }}>
                      {p.timeline_weeks ? `${p.timeline_weeks} weeks` : "---"}
                    </td>
                    <td>
                      <select
                        value={p.status}
                        onChange={(e) => updateStatus(p.id, e.target.value)}
                        style={{
                          background: "rgba(255,255,255,.06)",
                          border: "1px solid rgba(255,255,255,.12)",
                          borderRadius: 6,
                          padding: "4px 8px",
                          color: "#fff",
                          fontSize: ".75rem",
                          fontFamily: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ fontSize: ".78rem", color: "rgba(255,255,255,.5)" }}>
                      {p.valid_until
                        ? new Date(p.valid_until).toLocaleDateString("en-KE", {
                            dateStyle: "short",
                          })
                        : "---"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>New Proposal</h3>
                <p>Draft a quote for a client</p>
              </div>
              <button className="modal-close" onClick={() => setShowNew(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Client name<span className="required">*</span>
                  </label>
                  <input
                    className="form-input"
                    value={form.client_name}
                    onChange={(e) =>
                      setForm({ ...form, client_name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Title<span className="required">*</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="e.g., Greenhouse Feasibility"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Scope</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deliverables</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={form.deliverables}
                  onChange={(e) =>
                    setForm({ ...form, deliverables: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select
                    className="form-select"
                    value={form.currency}
                    onChange={(e) =>
                      setForm({ ...form, currency: e.target.value })
                    }
                  >
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Timeline (weeks)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.timeline_weeks}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        timeline_weeks: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Valid until</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.valid_until}
                    onChange={(e) =>
                      setForm({ ...form, valid_until: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: "center", color: "#111", borderColor: "#ddd" }}
                onClick={() => setShowNew(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-lime"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={create}
              >
                Create Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}