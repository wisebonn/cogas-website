"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/lib/hooks";
import { EmptyClients } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";

interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  county: string | null;
  industry: string | null;
  source: string | null;
  status: "prospect" | "active" | "dormant" | "churned";
  lifetime_value: number | null;
  notes: string | null;
  created_at: string;
}

export default function ClientsPage() {
  const { toastMsg, showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    county: "",
    industry: "",
    source: "referral",
    notes: "",
  });

  const load = async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    setClients((data as Client[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createClient = async () => {
    if (!form.name.trim()) return showToast("Name is required");
    const { error } = await supabase.from("clients").insert({
      name: form.name,
      company: form.company || null,
      email: form.email || null,
      phone: form.phone || null,
      county: form.county || null,
      industry: form.industry || null,
      source: form.source,
      notes: form.notes || null,
      status: "prospect",
    });
    if (error) return showToast("Error: " + error.message);
    setShowNew(false);
    setForm({
      name: "",
      company: "",
      email: "",
      phone: "",
      county: "",
      industry: "",
      source: "referral",
      notes: "",
    });
    load();
    showToast("Client added ✓");
  };

  const updateStatus = async (id: string, status: Client["status"]) => {
    await supabase.from("clients").update({ status }).eq("id", id);
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    showToast(`Status → ${status}`);
  };

  let filtered = clients;
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.company || "").toLowerCase().includes(s) ||
        (c.email || "").toLowerCase().includes(s) ||
        (c.county || "").toLowerCase().includes(s)
    );
  }
  if (statusFilter !== "all") {
    filtered = filtered.filter((c) => c.status === statusFilter);
  }

  const counts = {
    all: clients.length,
    prospect: clients.filter((c) => c.status === "prospect").length,
    active: clients.filter((c) => c.status === "active").length,
    dormant: clients.filter((c) => c.status === "dormant").length,
    churned: clients.filter((c) => c.status === "churned").length,
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
          flexWrap: "wrap",
        }}
      >
        <input
          className="search"
          placeholder="🔍 Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <button className="btn btn-lime" onClick={() => setShowNew(true)}>
          ＋ New Client
        </button>
      </div>

      <div className="filter-tabs">
        {(
          [
            ["all", "📋 All"],
            ["prospect", "🌱 Prospect"],
            ["active", "✅ Active"],
            ["dormant", "😴 Dormant"],
            ["churned", "❌ Churned"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className={`filter-tab ${statusFilter === key ? "active" : ""}`}
            onClick={() => setStatusFilter(key)}
          >
            {label}
            <span className="count">{counts[key as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="panel" style={{ marginTop: 0 }}>
          <EmptyClients />
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 0, padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>
                        {c.company || c.name}
                      </div>
                      {c.company && (
                        <small style={{ color: "rgba(255,255,255,.5)" }}>
                          {c.name}
                        </small>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: ".8rem" }}>{c.email || "---"}</div>
                      {c.phone && (
                        <small style={{ color: "rgba(255,255,255,.5)" }}>
                          {c.phone}
                        </small>
                      )}
                    </td>
                    <td style={{ fontSize: ".82rem" }}>
                      {c.county || "---"}
                      {c.industry && (
                        <small
                          style={{
                            display: "block",
                            color: "rgba(255,255,255,.5)",
                          }}
                        >
                          {c.industry}
                        </small>
                      )}
                    </td>
                    <td>
                      <select
                        value={c.status}
                        onChange={(e) =>
                          updateStatus(c.id, e.target.value as Client["status"])
                        }
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
                        <option value="prospect">Prospect</option>
                        <option value="active">Active</option>
                        <option value="dormant">Dormant</option>
                        <option value="churned">Churned</option>
                      </select>
                    </td>
                    <td style={{ fontSize: ".82rem" }}>
                      {c.lifetime_value
                        ? `KSh ${Number(c.lifetime_value).toLocaleString()}`
                        : "---"}
                    </td>
                    <td style={{ fontSize: ".78rem", color: "rgba(255,255,255,.5)" }}>
                      {new Date(c.created_at).toLocaleDateString("en-KE", {
                        dateStyle: "short",
                      })}
                    </td>
                    <td>
                      <button
                        className="btn-danger"
                        style={{ padding: "4px 10px", fontSize: ".68rem" }}
                        onClick={async () => {
                          if (!confirm(`Delete ${c.name}?`)) return;
                          await supabase.from("clients").delete().eq("id", c.id);
                          load();
                          showToast("Client deleted");
                        }}
                      >
                        Delete
                      </button>
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
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>Add Client</h3>
                <p>Create a new client record</p>
              </div>
              <button className="modal-close" onClick={() => setShowNew(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Name<span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input
                    className="form-input"
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <input
                    className="form-input"
                    value={form.industry}
                    onChange={(e) =>
                      setForm({ ...form, industry: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">County</label>
                  <input
                    className="form-input"
                    value={form.county}
                    onChange={(e) => setForm({ ...form, county: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select
                    className="form-select"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  >
                    <option value="referral">Referral</option>
                    <option value="website">Website</option>
                    <option value="cold">Cold outreach</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
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
                onClick={createClient}
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}