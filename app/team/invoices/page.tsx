"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast } from "@/lib/hooks";
import { EmptyExpenses } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";

const CATEGORIES = [
  "travel",
  "office",
  "field",
  "salaries",
  "marketing",
  "equipment",
  "other",
];

export default function ExpensesPage() {
  const { userEmail, isApprover } = useProfile();
  const { toastMsg, showToast } = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: 0,
    currency: "KES",
    category: "field",
    vendor: "",
    project_name: "",
    incurred_on: new Date().toISOString().split("T")[0],
  });

  const load = async () => {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .order("incurred_on", { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.description.trim()) return showToast("Description required");
    if (!form.amount) return showToast("Amount required");
    const { error } = await supabase.from("expenses").insert({
      description: form.description,
      amount: Number(form.amount),
      currency: form.currency,
      category: form.category,
      vendor: form.vendor || null,
      project_name: form.project_name || null,
      paid_by: userEmail,
      status: isApprover ? "approved" : "pending",
      approved_by: isApprover ? userEmail : null,
      approved_at: isApprover ? new Date().toISOString() : null,
      incurred_on: form.incurred_on,
    });
    if (error) return showToast("Error: " + error.message);
    setShowNew(false);
    setForm({
      description: "",
      amount: 0,
      currency: "KES",
      category: "field",
      vendor: "",
      project_name: "",
      incurred_on: new Date().toISOString().split("T")[0],
    });
    load();
    showToast(isApprover ? "Expense logged ✓" : "Expense submitted for approval");
  };

  const approve = async (id: string, status: "approved" | "rejected") => {
    await supabase
      .from("expenses")
      .update({
        status,
        approved_by: userEmail,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
    showToast(`Expense ${status}`);
  };

  const totalApproved = expenses
    .filter((e) => e.status === "approved")
    .reduce((a, e) => a + Number(e.amount), 0);
  const totalPending = expenses
    .filter((e) => e.status === "pending")
    .reduce((a, e) => a + Number(e.amount), 0);

  if (loading) return null;

  return (
    <div>
      <div className="kpi-grid" style={{ marginTop: 0 }}>
        <div className="kpi">
          <span>Total expenses</span>
          <b>{expenses.length}</b>
        </div>
        <div className="kpi">
          <span>Approved</span>
          <b>KSh {(totalApproved / 1000).toFixed(1)}K</b>
        </div>
        <div className="kpi">
          <span>Pending approval</span>
          <b>KSh {(totalPending / 1000).toFixed(1)}K</b>
          <small className="down">{expenses.filter((e) => e.status === "pending").length} items</small>
        </div>
        <div className="kpi">
          <span>This month</span>
          <b>
            {
              expenses.filter((e) => {
                const d = new Date(e.incurred_on);
                const now = new Date();
                return (
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear()
                );
              }).length
            }
          </b>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-lime" onClick={() => setShowNew(true)}>
          ＋ Log Expense
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="panel" style={{ marginTop: 0 }}>
          <EmptyExpenses />
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 0, padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Project</th>
                  <th>Amount</th>
                  <th>Paid by</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>
                        {e.description}
                      </div>
                      {e.vendor && (
                        <small style={{ color: "rgba(255,255,255,.5)" }}>
                          {e.vendor}
                        </small>
                      )}
                    </td>
                    <td style={{ fontSize: ".78rem", textTransform: "capitalize" }}>
                      {e.category}
                    </td>
                    <td style={{ fontSize: ".82rem" }}>
                      {e.project_name || "---"}
                    </td>
                    <td style={{ fontSize: ".85rem", color: "#a3e635" }}>
                      {e.currency} {Number(e.amount).toLocaleString()}
                    </td>
                    <td style={{ fontSize: ".78rem", color: "rgba(255,255,255,.6)" }}>
                      {e.paid_by}
                    </td>
                    <td style={{ fontSize: ".78rem", color: "rgba(255,255,255,.5)" }}>
                      {new Date(e.incurred_on).toLocaleDateString("en-KE", {
                        dateStyle: "short",
                      })}
                    </td>
                    <td>
                      <span
                        className={`urgency-strip ${
                          e.status === "approved"
                            ? "urgency-soon"
                            : e.status === "rejected"
                            ? "urgency-overdue"
                            : "urgency-today"
                        }`}
                        style={{
                          background:
                            e.status === "approved" ? "rgba(163,230,53,.2)" : undefined,
                          color: e.status === "approved" ? "#a3e635" : undefined,
                        }}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td>
                      {isApprover && e.status === "pending" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="btn btn-green"
                            style={{ padding: "3px 8px", fontSize: ".65rem" }}
                            onClick={() => approve(e.id, "approved")}
                          >
                            ✓
                          </button>
                          <button
                            className="btn-danger"
                            style={{ padding: "3px 8px", fontSize: ".65rem" }}
                            onClick={() => approve(e.id, "rejected")}
                          >
                            ✕
                          </button>
                        </div>
                      )}
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
            style={{ maxWidth: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>Log Expense</h3>
                <p>{isApprover ? "Added as approved" : "Goes to chair for approval"}</p>
              </div>
              <button className="modal-close" onClick={() => setShowNew(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Description<span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  placeholder="e.g., Field travel to Nakuru"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
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
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.incurred_on}
                    onChange={(e) =>
                      setForm({ ...form, incurred_on: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Vendor</label>
                  <input
                    className="form-input"
                    value={form.vendor}
                    onChange={(e) =>
                      setForm({ ...form, vendor: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project (optional)</label>
                  <input
                    className="form-input"
                    value={form.project_name}
                    onChange={(e) =>
                      setForm({ ...form, project_name: e.target.value })
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
                Log Expense
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}