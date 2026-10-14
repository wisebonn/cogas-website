"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/lib/hooks";
import { EmptyState } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";

export default function AgriMindAdminPage() {
  const { toastMsg, showToast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    title: "",
    source: "dad_research",
    author: "",
    year: new Date().getFullYear(),
    region: "",
    crop: "",
    tags: "",
    content: "",
  });

  const load = async () => {
    const { data } = await supabase
      .from("agrimind_documents")
      .select("*")
      .order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim()) return showToast("Title required");
    if (!form.content.trim()) return showToast("Content required");
    const { error } = await supabase.from("agrimind_documents").insert({
      title: form.title,
      source: form.source,
      author: form.author || null,
      year: Number(form.year) || null,
      region: form.region || null,
      crop: form.crop || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      content: form.content,
    });
    if (error) return showToast("Error: " + error.message);
    setShowNew(false);
    setForm({
      title: "", source: "dad_research", author: "", year: new Date().getFullYear(),
      region: "", crop: "", tags: "", content: "",
    });
    load();
    showToast("Document added to knowledge base ✓");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this document and all its chunks?")) return;
    await supabase.from("agrimind_documents").delete().eq("id", id);
    load();
    showToast("Deleted");
  };

  if (loading) return null;

  const bySource: Record<string, number> = {};
  docs.forEach((d) => { bySource[d.source] = (bySource[d.source] || 0) + 1; });

  return (
    <div>
      <div className="kpi-grid" style={{ marginTop: 0 }}>
        <div className="kpi">
          <span>Total documents</span>
          <b>{docs.length}</b>
          <small className="up">In knowledge base</small>
        </div>
        <div className="kpi">
          <span>Sources</span>
          <b>{Object.keys(bySource).length}</b>
        </div>
        <div className="kpi">
          <span>Regions</span>
          <b>{new Set(docs.map((d) => d.region).filter(Boolean)).size}</b>
        </div>
        <div className="kpi">
          <span>Crops covered</span>
          <b>{new Set(docs.map((d) => d.crop).filter(Boolean)).size}</b>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, marginTop: 20 }}>
        <button className="btn btn-lime" onClick={() => setShowNew(true)}>＋ Add Document</button>
      </div>

      {docs.length === 0 ? (
        <div className="panel" style={{ marginTop: 0 }}>
          <EmptyState
            dark
            icon="🌿"
            title="Knowledge base is empty"
            description="Feed AgriMind with research papers, field notes, trial data, and market reports. Each document becomes searchable."
          />
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 0, padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr><th>Title</th><th>Source</th><th>Author</th><th>Year</th><th>Region</th><th>Crop</th><th></th></tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{d.title}</div>
                      <small style={{ color: "rgba(255,255,255,.5)" }}>{d.content.slice(0, 70)}...</small>
                    </td>
                    <td style={{ fontSize: ".78rem" }}>
                      <span className="task-type-badge type-admin">{d.source}</span>
                    </td>
                    <td style={{ fontSize: ".82rem" }}>{d.author || "---"}</td>
                    <td style={{ fontSize: ".82rem" }}>{d.year || "---"}</td>
                    <td style={{ fontSize: ".82rem" }}>{d.region || "---"}</td>
                    <td style={{ fontSize: ".82rem" }}>{d.crop || "---"}</td>
                    <td>
                      <button className="btn-danger" style={{ padding: "4px 10px", fontSize: ".68rem" }} onClick={() => remove(d.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 22, padding: 20, background: "rgba(217,164,65,.08)",
          border: "1px solid rgba(217,164,65,.25)", borderRadius: 14,
        }}
      >
        <b style={{ color: "#fbbf24", display: "block", marginBottom: 6 }}>🤖 AI embeddings (RAG)</b>
        <small style={{ color: "rgba(255,255,255,.65)", fontSize: ".82rem", lineHeight: 1.6 }}>
          Documents are stored and searchable via keyword. Automatic AI embeddings for semantic search are the next step —
          deploy the <code>agrimind-embed</code> edge function and set <code>OPENAI_API_KEY</code> to enable it.
        </small>
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal-card" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div><h3>Add to Knowledge Base</h3><p>Research paper, field note, dataset or report</p></div>
              <button className="modal-close" onClick={() => setShowNew(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title<span className="required">*</span></label>
                <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select className="form-select" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                    <option value="dad_research">Dad's research</option>
                    <option value="trial_data">Trial data</option>
                    <option value="field_notes">Field notes</option>
                    <option value="market_report">Market report</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Author</label>
                  <input className="form-input" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input className="form-input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Region</label>
                  <input className="form-input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Crop</label>
                  <input className="form-input" value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input className="form-input" placeholder="greenhouse, tomato, nakuru" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Content<span className="required">*</span></label>
                <textarea className="form-textarea" rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Full text of the document, study, or notes..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", color: "#111", borderColor: "#ddd" }} onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-lime" style={{ flex: 1, justifyContent: "center" }} onClick={create}>Add Document</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}