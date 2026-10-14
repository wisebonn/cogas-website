"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast } from "@/lib/hooks";
import { EmptyState } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  department: string | null;
  phone: string | null;
  is_approved: boolean;
  created_at: string;
}

interface Contract {
  id: string;
  user_email: string;
  contract_type: string | null;
  gross_monthly: number | null;
  start_date: string | null;
  kra_pin: string | null;
  nssf_no: string | null;
  shif_no: string | null;
  bank_account: string | null;
}

export default function PeoplePage() {
  const { isApprover, userEmail } = useProfile();
  const { toastMsg, showToast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [contracts, setContracts] = useState<Record<string, Contract>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [contractForm, setContractForm] = useState({
    contract_type: "full_time",
    gross_monthly: 0,
    start_date: "",
    kra_pin: "",
    nssf_no: "",
    shif_no: "",
    bank_account: "",
  });

  const load = async () => {
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    setMembers((p as TeamMember[]) || []);

    const { data: c } = await supabase.from("staff_contracts").select("*");
    if (c) {
      const map: Record<string, Contract> = {};
      c.forEach((x: any) => {
        map[x.user_email] = x;
      });
      setContracts(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openContract = (m: TeamMember) => {
    setEditing(m);
    const existing = contracts[m.email];
    if (existing) {
      setContractForm({
        contract_type: existing.contract_type || "full_time",
        gross_monthly: existing.gross_monthly || 0,
        start_date: existing.start_date || "",
        kra_pin: existing.kra_pin || "",
        nssf_no: existing.nssf_no || "",
        shif_no: existing.shif_no || "",
        bank_account: existing.bank_account || "",
      });
    } else {
      setContractForm({
        contract_type: "full_time",
        gross_monthly: 0,
        start_date: "",
        kra_pin: "",
        nssf_no: "",
        shif_no: "",
        bank_account: "",
      });
    }
  };

  const saveContract = async () => {
    if (!editing) return;
    const payload = {
      user_email: editing.email,
      user_name: editing.full_name || editing.email,
      role: editing.role,
      department: editing.department,
      contract_type: contractForm.contract_type,
      gross_monthly: Number(contractForm.gross_monthly) || 0,
      start_date: contractForm.start_date || null,
      kra_pin: contractForm.kra_pin || null,
      nssf_no: contractForm.nssf_no || null,
      shif_no: contractForm.shif_no || null,
      bank_account: contractForm.bank_account || null,
    };
    const { error } = await supabase
      .from("staff_contracts")
      .upsert(payload, { onConflict: "user_email" });
    if (error) return showToast("Error: " + error.message);
    setEditing(null);
    load();
    showToast("Contract saved ✓");
  };

  const approve = async (id: string, approved: boolean) => {
    await supabase.from("profiles").update({ is_approved: approved }).eq("id", id);
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_approved: approved } : m))
    );
    showToast(approved ? "Approved ✓" : "Revoked");
  };

  const changeRole = async (id: string, role: string) => {
    await supabase.from("profiles").update({ role }).eq("id", id);
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
    showToast(`Role → ${role}`);
  };

  if (loading) return null;

  const pending = members.filter((m) => !m.is_approved && m.role !== "client");
  const active = members.filter((m) => m.is_approved && m.role !== "client");
  const clients = members.filter((m) => m.role === "client");

  return (
    <div>
      <div className="kpi-grid" style={{ marginTop: 0 }}>
        <div className="kpi">
          <span>Team members</span>
          <b>{active.length}</b>
          <small className="up">Approved</small>
        </div>
        <div className="kpi">
          <span>Pending</span>
          <b>{pending.length}</b>
          {pending.length > 0 && <small className="down">Awaiting approval</small>}
        </div>
        <div className="kpi">
          <span>Approvers</span>
          <b>{active.filter((m) => ["chair", "cochair"].includes(m.role)).length}</b>
        </div>
        <div className="kpi">
          <span>Clients</span>
          <b>{clients.length}</b>
        </div>
      </div>

      {pending.length > 0 && isApprover && (
        <div
          className="panel"
          style={{ marginTop: 20, borderLeft: "4px solid #fbbf24" }}
        >
          <h3>⏳ Awaiting Approval</h3>
          {pending.map((m) => (
            <div
              key={m.id}
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
                <div style={{ fontWeight: 600, color: "#fff" }}>
                  {m.full_name || m.email}
                </div>
                <small style={{ color: "rgba(255,255,255,.5)", fontSize: ".75rem" }}>
                  {m.email} · joined{" "}
                  {new Date(m.created_at).toLocaleDateString("en-KE", {
                    dateStyle: "short",
                  })}
                </small>
              </div>
              <button
                className="btn btn-green"
                style={{ padding: "6px 14px", fontSize: ".75rem" }}
                onClick={() => approve(m.id, true)}
              >
                ✓ Approve
              </button>
              <button
                className="btn-danger"
                style={{ padding: "6px 12px", fontSize: ".72rem" }}
                onClick={() => approve(m.id, false)}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="panel" style={{ marginTop: 20, padding: 0 }}>
        <div style={{ padding: "20px 22px 8px" }}>
          <h3 style={{ margin: 0 }}>👥 Team</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Department</th>
                <th>Contract</th>
                <th>Gross (monthly)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {active.map((m) => {
                const c = contracts[m.email];
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>
                        {m.full_name || m.email}
                      </div>
                      <small style={{ color: "rgba(255,255,255,.5)" }}>
                        {m.email}
                      </small>
                    </td>
                    <td>
                      {isApprover ? (
                        <select
                          value={m.role}
                          onChange={(e) => changeRole(m.id, e.target.value)}
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
                          <option value="chair">Chair</option>
                          <option value="cochair">Co-chair</option>
                          <option value="member">Member</option>
                          <option value="consultant">Consultant</option>
                          <option value="intern">Intern</option>
                        </select>
                      ) : (
                        <span className={`role-badge role-${m.role}`}>
                          {m.role}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: ".82rem" }}>
                      {m.department || "---"}
                    </td>
                    <td style={{ fontSize: ".78rem", textTransform: "capitalize" }}>
                      {c?.contract_type || "---"}
                    </td>
                    <td style={{ fontSize: ".85rem", color: "#a3e635" }}>
                      {c?.gross_monthly
                        ? `KSh ${Number(c.gross_monthly).toLocaleString()}`
                        : "---"}
                    </td>
                    <td>
                      {isApprover && (
                        <button
                          className="btn btn-ghost"
                          style={{
                            padding: "4px 10px",
                            fontSize: ".68rem",
                            borderColor: "rgba(255,255,255,.2)",
                          }}
                          onClick={() => openContract(m)}
                        >
                          {contracts[m.email] ? "Edit contract" : "Add contract"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {clients.length > 0 && (
        <div className="panel" style={{ marginTop: 20, padding: 0 }}>
          <div style={{ padding: "20px 22px 8px" }}>
            <h3 style={{ margin: 0 }}>🤝 Clients</h3>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".8rem", marginTop: 4 }}>
              Client portal users
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Organisation</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff" }}>
                        {m.full_name || m.email}
                      </div>
                      <small style={{ color: "rgba(255,255,255,.5)" }}>
                        {m.email}
                      </small>
                    </td>
                    <td style={{ fontSize: ".82rem" }}>{m.department || "---"}</td>
                    <td style={{ fontSize: ".78rem", color: "rgba(255,255,255,.5)" }}>
                      {new Date(m.created_at).toLocaleDateString("en-KE", {
                        dateStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>{contracts[editing.email] ? "Edit" : "Add"} Contract</h3>
                <p>{editing.full_name || editing.email}</p>
              </div>
              <button className="modal-close" onClick={() => setEditing(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contract type</label>
                  <select
                    className="form-select"
                    value={contractForm.contract_type}
                    onChange={(e) =>
                      setContractForm({
                        ...contractForm,
                        contract_type: e.target.value,
                      })
                    }
                  >
                    <option value="full_time">Full time</option>
                    <option value="part_time">Part time</option>
                    <option value="contractor">Contractor</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Gross monthly (KSh)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={contractForm.gross_monthly}
                    onChange={(e) =>
                      setContractForm({
                        ...contractForm,
                        gross_monthly: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Start date</label>
                <input
                  className="form-input"
                  type="date"
                  value={contractForm.start_date}
                  onChange={(e) =>
                    setContractForm({
                      ...contractForm,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">KRA PIN</label>
                  <input
                    className="form-input"
                    value={contractForm.kra_pin}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, kra_pin: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">NSSF No</label>
                  <input
                    className="form-input"
                    value={contractForm.nssf_no}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, nssf_no: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SHIF No</label>
                  <input
                    className="form-input"
                    value={contractForm.shif_no}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, shif_no: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bank account</label>
                  <input
                    className="form-input"
                    value={contractForm.bank_account}
                    onChange={(e) =>
                      setContractForm({
                        ...contractForm,
                        bank_account: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: "center", color: "#111", borderColor: "#ddd" }}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-lime"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={saveContract}
              >
                Save Contract
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}