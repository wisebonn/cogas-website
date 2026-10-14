"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast } from "@/lib/hooks";
import { EmptyLeave } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";

const LEAVE_TYPES = [
  { value: "annual", label: "🏖 Annual leave" },
  { value: "sick", label: "🤒 Sick leave" },
  { value: "maternity", label: "👶 Maternity" },
  { value: "paternity", label: "👶 Paternity" },
  { value: "compassionate", label: "🕊 Compassionate" },
  { value: "unpaid", label: "💸 Unpaid" },
  { value: "study", label: "📚 Study leave" },
];

export default function LeavePage() {
  const { userEmail, isApprover } = useProfile();
  const { toastMsg, showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "mine" | "pending">("all");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const load = async () => {
    const { data } = await supabase
      .from("leave_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.start_date || !form.end_date)
      return showToast("Start and end date required");

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    if (end < start) return showToast("End date must be after start date");

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const { error } = await supabase.from("leave_requests").insert({
      user_email: userEmail,
      user_name: userEmail,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      days_requested: days,
      reason: form.reason || null,
      status: "pending",
    });
    if (error) return showToast("Error: " + error.message);
    setShowNew(false);
    setForm({
      leave_type: "annual",
      start_date: "",
      end_date: "",
      reason: "",
    });
    load();
    showToast("Leave request submitted ✓");
  };

  const review = async (id: string, status: "approved" | "rejected", note?: string) => {
    await supabase
      .from("leave_requests")
      .update({
        status,
        reviewed_by: userEmail,
        reviewed_at: new Date().toISOString(),
        review_note: note || null,
      })
      .eq("id", id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    showToast(`Leave ${status}`);
  };

  const cancel = async (id: string) => {
    await supabase
      .from("leave_requests")
      .update({ status: "cancelled" })
      .eq("id", id);
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "cancelled" } : i))
    );
    showToast("Cancelled");
  };

  if (loading) return null;

  let filtered = items;
  if (filter === "mine") filtered = filtered.filter((i) => i.user_email === userEmail);
  if (filter === "pending") filtered = filtered.filter((i) => i.status === "pending");

  const counts = {
    all: items.length,
    mine: items.filter((i) => i.user_email === userEmail).length,
    pending: items.filter((i) => i.status === "pending").length,
  };

  const myBalance = 21 - items
    .filter(
      (i) =>
        i.user_email === userEmail &&
        i.status === "approved" &&
        i.leave_type === "annual"
    )
    .reduce((a, i) => a + Number(i.days_requested || 0), 0);

  return (
    <div>
      <div className="kpi-grid" style={{ marginTop: 0 }}>
        <div className="kpi">
          <span>Annual balance</span>
          <b>{myBalance} days</b>
          <small>Of 21 days allowance</small>
        </div>
        <div className="kpi">
          <span>Pending (team)</span>
          <b>{counts.pending}</b>
          {counts.pending > 0 && <small className="down">Awaiting review</small>}
        </div>
        <div className="kpi">
          <span>My requests</span>
          <b>{counts.mine}</b>
        </div>
        <div className="kpi">
          <span>Total this year</span>
          <b>
            {items.filter((i) => new Date(i.start_date).getFullYear() === new Date().getFullYear()).length}
          </b>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginTop: 20,
        }}
      >
        <div className="filter-tabs" style={{ margin: 0, border: "none", padding: 0 }}>
          {(
            [
              ["all", "📋 All"],
              ["mine", "👤 Mine"],
              ["pending", "⏳ Pending"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={`filter-tab ${filter === key ? "active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
              <span className="count">{counts[key as keyof typeof counts]}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-lime" onClick={() => setShowNew(true)}>
          ＋ Request Leave
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="panel" style={{ marginTop: 0 }}>
          <EmptyLeave />
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 0, padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600, color: "#fff", fontSize: ".85rem" }}>
                      {i.user_name || i.user_email}
                      {i.user_email === userEmail && (
                        <small style={{ color: "#a3e635", marginLeft: 8 }}>
                          (you)
                        </small>
                      )}
                    </td>
                    <td style={{ fontSize: ".82rem", textTransform: "capitalize" }}>
                      {LEAVE_TYPES.find((t) => t.value === i.leave_type)?.label || i.leave_type}
                    </td>
                    <td style={{ fontSize: ".8rem" }}>
                      {new Date(i.start_date).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      →{" "}
                      {new Date(i.end_date).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td style={{ fontSize: ".82rem" }}>{i.days_requested}</td>
                    <td
                      style={{
                        fontSize: ".78rem",
                        color: "rgba(255,255,255,.6)",
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {i.reason || "---"}
                    </td>
                    <td>
                      <span
                        className={`urgency-strip ${
                          i.status === "approved"
                            ? "urgency-soon"
                            : i.status === "rejected" || i.status === "cancelled"
                            ? "urgency-overdue"
                            : "urgency-today"
                        }`}
                        style={{
                          background:
                            i.status === "approved"
                              ? "rgba(163,230,53,.2)"
                              : undefined,
                          color: i.status === "approved" ? "#a3e635" : undefined,
                        }}
                      >
                        {i.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        {isApprover && i.status === "pending" && (
                          <>
                            <button
                              className="btn btn-green"
                              style={{ padding: "4px 10px", fontSize: ".65rem" }}
                              onClick={() => review(i.id, "approved")}
                            >
                              ✓
                            </button>
                            <button
                              className="btn-danger"
                              style={{ padding: "4px 10px", fontSize: ".65rem" }}
                              onClick={() => review(i.id, "rejected")}
                            >
                              ✕
                            </button>
                          </>
                        )}
                        {i.user_email === userEmail && i.status === "pending" && (
                          <button
                            className="btn-danger"
                            style={{ padding: "4px 10px", fontSize: ".65rem" }}
                            onClick={() => cancel(i.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
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
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>Request Leave</h3>
                <p>Submitted to chair/co-chair for approval</p>
              </div>
              <button className="modal-close" onClick={() => setShowNew(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Leave type</label>
                <select
                  className="form-select"
                  value={form.leave_type}
                  onChange={(e) =>
                    setForm({ ...form, leave_type: e.target.value })
                  }
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Start<span className="required">*</span>
                  </label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({ ...form, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    End<span className="required">*</span>
                  </label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm({ ...form, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
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
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}