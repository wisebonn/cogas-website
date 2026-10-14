"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast } from "@/lib/hooks";
import { EmptyMeetings } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";

export default function MeetingsPage() {
  const { userEmail } = useProfile();
  const { toastMsg, showToast } = useToast();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    starts_at: "",
    duration_mins: 30,
    location: "zoom",
    meeting_url: "",
    client_email: "",
    project_name: "",
  });

  const load = async () => {
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .order("starts_at", { ascending: false });
    setMeetings(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim()) return showToast("Title required");
    if (!form.starts_at) return showToast("Start time required");
    const starts = new Date(form.starts_at);
    const ends = new Date(starts.getTime() + form.duration_mins * 60000);
    const { error } = await supabase.from("meetings").insert({
      title: form.title,
      description: form.description || null,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      duration_mins: form.duration_mins,
      location: form.location,
      meeting_url: form.meeting_url || null,
      organiser_email: userEmail,
      attendees: [userEmail],
      client_email: form.client_email || null,
      project_name: form.project_name || null,
      status: "scheduled",
    });
    if (error) return showToast("Error: " + error.message);
    setShowNew(false);
    setForm({
      title: "", description: "", starts_at: "", duration_mins: 30,
      location: "zoom", meeting_url: "", client_email: "", project_name: "",
    });
    load();
    showToast("Meeting scheduled ✓");
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("meetings").update({ status }).eq("id", id);
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    showToast(`Meeting → ${status}`);
  };

  if (loading) return null;

  const now = Date.now();
  const upcoming = meetings
    .filter((m) => new Date(m.starts_at).getTime() >= now && m.status === "scheduled")
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const past = meetings.filter(
    (m) => new Date(m.starts_at).getTime() < now || m.status !== "scheduled"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: ".85rem", color: "rgba(255,255,255,.6)" }}>
          {upcoming.length} upcoming · {past.length} past
        </div>
        <button className="btn btn-lime" onClick={() => setShowNew(true)}>＋ Schedule Meeting</button>
      </div>

      {upcoming.length > 0 && (
        <div className="panel" style={{ marginTop: 0, marginBottom: 20 }}>
          <h3>📅 Upcoming</h3>
          {upcoming.map((m) => <MeetingRow key={m.id} meeting={m} onUpdate={updateStatus} />)}
        </div>
      )}

      {past.length > 0 && (
        <div className="panel" style={{ opacity: 0.75 }}>
          <h3>Past meetings</h3>
          {past.slice(0, 15).map((m) => <MeetingRow key={m.id} meeting={m} onUpdate={updateStatus} muted />)}
        </div>
      )}

      {meetings.length === 0 && (
        <div className="panel" style={{ marginTop: 0 }}><EmptyMeetings /></div>
      )}

      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div><h3>Schedule Meeting</h3><p>Book a call or physical meeting</p></div>
              <button className="modal-close" onClick={() => setShowNew(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title<span className="required">*</span></label>
                <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date & time<span className="required">*</span></label>
                  <input className="form-input" type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (mins)</label>
                  <input className="form-input" type="number" value={form.duration_mins} onChange={(e) => setForm({ ...form, duration_mins: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select className="form-select" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                    <option value="zoom">Zoom</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="physical">Physical</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Meeting URL</label>
                  <input className="form-input" value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Client email</label>
                  <input className="form-input" type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Project (optional)</label>
                  <input className="form-input" value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", color: "#111", borderColor: "#ddd" }} onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-lime" style={{ flex: 1, justifyContent: "center" }} onClick={create}>Schedule</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}

function MeetingRow({ meeting, onUpdate, muted }: any) {
  const d = new Date(meeting.starts_at);
  return (
    <div className="meet">
      <div style={{ flex: 1 }}>
        <b>{meeting.title}</b>
        <small>
          {d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })} ·{" "}
          {d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })} ·{" "}
          {meeting.duration_mins}min · {meeting.location}
        </small>
        {meeting.project_name && <small style={{ color: "rgba(163,230,53,.7)" }}>{meeting.project_name}</small>}
      </div>
      {!muted && meeting.meeting_url && (
        <a href={meeting.meeting_url} target="_blank" rel="noopener" className="btn btn-green" style={{ padding: "6px 14px", fontSize: ".75rem" }}>
          Join
        </a>
      )}
      {!muted && meeting.status === "scheduled" && (
        <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: ".7rem", borderColor: "rgba(255,255,255,.2)" }} onClick={() => onUpdate(meeting.id, "completed")}>
          ✓ Done
        </button>
      )}
    </div>
  );
}