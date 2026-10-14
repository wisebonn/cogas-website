"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast } from "@/lib/hooks";
import { Toast } from "@/components/Toast";

export default function SettingsPage() {
  const { userEmail, isApprover, profile } = useProfile();
  const { toastMsg, showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setDepartment(profile.department || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!isApprover) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_approved", false)
        .neq("role", "client");
      setPending(data || []);
    };
    load();
  }, [isApprover]);

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, department })
      .eq("email", userEmail);
    setSaving(false);
    if (error) return showToast("Error: " + error.message);
    showToast("Profile saved ✓");
  };

  const approveUser = async (id: string, approved: boolean) => {
    await supabase.from("profiles").update({ is_approved: approved }).eq("id", id);
    setPending((prev) => prev.filter((p) => p.id !== id));
    showToast(approved ? "User approved ✓" : "Revoked");
  };

  return (
    <div>
      <div className="panel" style={{ marginTop: 0, maxWidth: 620 }}>
        <h3>👤 My Profile</h3>
        <div style={{ marginTop: 16 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={userEmail} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-lime" style={{ justifyContent: "center", width: "100%" }} onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      {isApprover && pending.length > 0 && (
        <div className="panel" style={{ marginTop: 20, maxWidth: 620, borderLeft: "4px solid #fbbf24" }}>
          <h3>⏳ Pending approvals ({pending.length})</h3>
          {pending.map((u) => (
            <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.05)", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <b style={{ color: "#fff", fontSize: ".85rem" }}>{u.full_name || u.email}</b>
                <small style={{ display: "block", color: "rgba(255,255,255,.5)", fontSize: ".72rem" }}>{u.email}</small>
              </div>
              <button className="btn btn-green" style={{ padding: "4px 10px", fontSize: ".7rem" }} onClick={() => approveUser(u.id, true)}>Approve</button>
              <button className="btn-danger" style={{ padding: "4px 10px", fontSize: ".7rem" }} onClick={() => approveUser(u.id, false)}>Reject</button>
            </div>
          ))}
        </div>
      )}

      {isApprover && (
        <div className="panel" style={{ marginTop: 20, maxWidth: 620 }}>
          <h3>🔗 Invite team member</h3>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".85rem", marginTop: 8 }}>
            Share this link — they sign up, you approve.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <input className="form-input" readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/signup`} />
            <button className="btn btn-lime" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/signup`); showToast("Link copied ✓"); }}>Copy</button>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}