"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/lib/hooks";
import { EmptyEnquiries } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";

const STAGES = [
  { key: "new", label: "🆕 New", color: "#60a5fa" },
  { key: "contacted", label: "📞 Contacted", color: "#a3e635" },
  { key: "qualified", label: "⭐ Qualified", color: "#fbbf24" },
  { key: "proposal_sent", label: "📤 Proposal Sent", color: "#c4b5fd" },
  { key: "won", label: "✅ Won", color: "#4ade80" },
  { key: "lost", label: "❌ Lost", color: "#f87171" },
];

interface Enquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  service_interest: string | null;
  message: string | null;
  source: string | null;
  stage: string;
  assigned_to: string | null;
  estimated_value: number | null;
  currency: string | null;
  created_at: string;
}

export default function EnquiriesPage() {
  const { toastMsg, showToast } = useToast();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Enquiry | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });
    setEnquiries((data as Enquiry[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const moveStage = async (id: string, stage: string) => {
    await supabase.from("enquiries").update({ stage }).eq("id", id);
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, stage } : e)));
    showToast(`Moved to ${stage}`);
  };

  const deleteEnquiry = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    await supabase.from("enquiries").delete().eq("id", id);
    setSelected(null);
    load();
    showToast("Enquiry deleted");
  };

  if (loading) return null;

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: ".85rem", color: "rgba(255,255,255,.6)" }}>
        {enquiries.length} total ·{" "}
        {enquiries.filter((e) => e.stage === "new").length} new
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 12,
          overflowX: "auto",
        }}
      >
        {STAGES.map((col) => {
          const list = enquiries.filter((e) => e.stage === col.key);
          return (
            <div key={col.key} className="col" style={{ minWidth: 220 }}>
              <h3
                style={{
                  borderBottom: `2px solid ${col.color}`,
                  paddingBottom: 8,
                }}
              >
                {col.label} <span>{list.length}</span>
              </h3>
              <div>
                {list.map((e) => (
                  <div
                    key={e.id}
                    className="task"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(e)}
                  >
                    <b style={{ fontSize: ".85rem" }}>{e.name}</b>
                    {e.company && (
                      <small style={{ display: "block" }}>{e.company}</small>
                    )}
                    {e.service_interest && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: ".65rem",
                          padding: "2px 7px",
                          background: "rgba(163,230,53,.15)",
                          color: "#a3e635",
                          borderRadius: 4,
                          display: "inline-block",
                        }}
                      >
                        {e.service_interest}
                      </div>
                    )}
                    {e.estimated_value && (
                      <small
                        style={{
                          display: "block",
                          marginTop: 6,
                          color: "#a3e635",
                        }}
                      >
                        {e.currency || "KES"}{" "}
                        {Number(e.estimated_value).toLocaleString()}
                      </small>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        marginTop: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {STAGES.filter((s) => s.key !== e.stage).slice(0, 3).map((s) => (
                        <button
                          key={s.key}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            moveStage(e.id, s.key);
                          }}
                          style={{
                            background: "rgba(255,255,255,.06)",
                            border: "1px solid rgba(255,255,255,.12)",
                            color: "rgba(255,255,255,.7)",
                            borderRadius: 4,
                            padding: "2px 6px",
                            fontSize: ".6rem",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                          title={`Move to ${s.key}`}
                        >
                          →
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {list.length === 0 && (
                  <p
                    style={{
                      color: "rgba(255,255,255,.3)",
                      fontSize: ".75rem",
                      textAlign: "center",
                      padding: "20px 0",
                    }}
                  >
                    Empty
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>{selected.name}</h3>
                <p>{selected.company || "Individual enquiry"}</p>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="form-label">Email</label>
                  <div style={{ fontSize: ".85rem", color: "#333" }}>
                    {selected.email || "---"}
                  </div>
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <div style={{ fontSize: ".85rem", color: "#333" }}>
                    {selected.phone || "---"}
                  </div>
                </div>
                <div>
                  <label className="form-label">Service</label>
                  <div style={{ fontSize: ".85rem", color: "#333" }}>
                    {selected.service_interest || "---"}
                  </div>
                </div>
                <div>
                  <label className="form-label">Source</label>
                  <div style={{ fontSize: ".85rem", color: "#333" }}>
                    {selected.source || "---"}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Message</label>
                <div
                  style={{
                    padding: 12,
                    background: "#f9fafb",
                    borderRadius: 8,
                    fontSize: ".85rem",
                    color: "#333",
                    whiteSpace: "pre-wrap",
                    maxHeight: 240,
                    overflowY: "auto",
                  }}
                >
                  {selected.message || "No message"}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Move to stage</label>
                <select
                  className="form-select"
                  value={selected.stage}
                  onChange={(e) => {
                    moveStage(selected.id, e.target.value);
                    setSelected({ ...selected, stage: e.target.value });
                  }}
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-danger"
                style={{ padding: "10px 16px" }}
                onClick={() => deleteEnquiry(selected.id)}
              >
                Delete
              </button>
              <button
                className="btn btn-lime"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}