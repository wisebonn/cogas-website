"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/lib/hooks";
import { EmptyState } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";

export default function CompliancePage() {
  const { toastMsg, showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "tax",
    due_date: "",
    recurring: "none",
    notes: "",
  });

  const load = async () => {
    const { data } = await supabase
      .from("compliance_items")
      .select("*")
      .order("due_date", { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.title.trim()) return showToast("Title required");
    if (!form.due_date) return showToast("Due date required");
    const { error } = await supabase.from("compliance_items").insert({
      title: form.title,
      category: form.category,
      due_date: form.due_date,
      recurring: form.recurring,
      notes: form.notes || null,
      status: "pending",
    });
    if (error) return showToast("Error: " + error.message);
    setShowNew(false);
    setForm({
      title: "",
      category: "tax",
      due_date: "",
      recurring: "none",
      notes: "",
    });
    load();
    showToast("Compliance item added ✓");
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from("compliance_items")
      .update({
        status,
        completed_at: status === "done" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    showToast(`Status → ${status}`);
  };

  if (loading) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const withDays = items.map((it) => {
    const due = new Date(it.due_date);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { ...it, daysUntil: diff };
  });

  const overdue = withDays.filter((i) => i.daysUntil < 0 && i.status !== "done");
  const dueSoon = withDays.filter(
    (i) => i.daysUntil >= 0 && i.daysUntil <= 30 && i.status !== "done"
  );
  const upcoming = withDays.filter(
    (i) => i.daysUntil > 30 && i.status !== "done"
  );
  const done = withDays.filter((i) => i.status === "done");

  return (
    <div>
      <div className="kpi-grid" style={{ marginTop: 0 }}>
        <div className="kpi">
          <span>Overdue</span>
          <b style={{ color: overdue.length > 0 ? "#f87171" : "#fff" }}>
            {overdue.length}
          </b>
        </div>
        <div className="kpi">
          <span>Due ≤30 days</span>
          <b style={{ color: dueSoon.length > 0 ? "#fbbf24" : "#fff" }}>
            {dueSoon.length}
          </b>
        </div>
        <div className="kpi">
          <span>Upcoming</span>
          <b>{upcoming.length}</b>
        </div>
        <div className="kpi">
          <span>Done</span>
          <b style={{ color: "#a3e635" }}>{done.length}</b>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-lime" onClick={() => setShowNew(true)}>
          ＋ Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="panel" style={{ marginTop: 0 }}>
          <EmptyState
            dark
            icon="⚖️"
            title="No compliance items yet"
            description="Track VAT, PAYE, NSSF, SHIF, licences, insurance renewals and other statutory deadlines here."
          />
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <Section title="🚨 Overdue" items={overdue} updateStatus={updateStatus} />
          )}
          {dueSoon.length > 0 && (
            <Section
              title="⏰ Due within 30 days"
              items={dueSoon}
              updateStatus={updateStatus}
            />
          )}
          {upcoming.length > 0 && (
            <Section
              title="📅 Upcoming"
              items={upcoming}
              updateStatus={updateStatus}
            />
          )}
          {done.length > 0 && (
            <Section
              title="✅ Completed"
              items={done.slice(0, 10)}
              updateStatus={updateStatus}
              muted
            />
          )}
        </>
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
                <h3>New Compliance Item</h3>
                <p>Track a statutory or operational deadline</p>
              </div>
              <button className="modal-close" onClick={() => setShowNew(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Title<span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  placeholder="e.g., VAT Return — October"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
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
                    <option value="tax">Tax</option>
                    <option value="licence">Licence</option>
                    <option value="insurance">Insurance</option>
                    <option value="filing">Filing</option>
                    <option value="inspection">Inspection</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Due date<span className="required">*</span>
                  </label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.due_date}
                    onChange={(e) =>
                      setForm({ ...form, due_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Recurring</label>
                <select
                  className="form-select"
                  value={form.recurring}
                  onChange={(e) =>
                    setForm({ ...form, recurring: e.target.value })
                  }
                >
                  <option value="none">One-off</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}

function Section({
  title,
  items,
  updateStatus,
  muted,
}: {
  title: string;
  items: any[];
  updateStatus: (id: string, s: string) => void;
  muted?: boolean;
}) {
  return (
    <div className="panel" style={{ marginTop: 16, opacity: muted ? 0.7 : 1 }}>
      <h3>{title}</h3>
      {items.map((i) => (
        <div
          key={i.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: "1px solid rgba(255,255,255,.05)",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "#fff", fontSize: ".9rem" }}>
              {i.title}
            </div>
            <small style={{ color: "rgba(255,255,255,.5)", fontSize: ".75rem" }}>
              {i.category}
              {i.recurring !== "none" && ` · ${i.recurring}`}
              {i.daysUntil !== undefined &&
                i.status !== "done" &&
                ` · ${i.daysUntil < 0 ? `${Math.abs(i.daysUntil)}d overdue` : `in ${i.daysUntil}d`}`}
            </small>
          </div>
          <span
            style={{
              fontSize: ".78rem",
              color: "rgba(255,255,255,.6)",
              minWidth: 100,
              textAlign: "right",
            }}
          >
            {new Date(i.due_date).toLocaleDateString("en-KE", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <select
            value={i.status}
            onChange={(e) => updateStatus(i.id, e.target.value)}
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 6,
              padding: "4px 8px",
              color: "#fff",
              fontSize: ".72rem",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
            <option value="overdue">Overdue</option>
            <option value="waived">Waived</option>
          </select>
        </div>
      ))}
    </div>
  );
}