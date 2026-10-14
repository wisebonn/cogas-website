"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast, useRotatingTz, fmtInTz, TIMEZONES } from "@/lib/hooks";
import { TaskCard, getUrgency, remainingInfo } from "@/components/TaskCard";
import { EmptyTasks } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";

export default function TeamDashboard() {
  const { userEmail, userId, isApprover, loading: profileLoading } = useProfile();
  const { toastMsg, showToast } = useToast();
  const tz = useRotatingTz();

  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, any[]>>({});
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [clockedIn, setClockedIn] = useState(false);
  const [timeSecs, setTimeSecs] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [dateLine, setDateLine] = useState("");

  const [noteTask, setNoteTask] = useState<any>(null);
  const [noteText, setNoteText] = useState("");
  const [approveModal, setApproveModal] = useState<any>(null);
  const [approveDays, setApproveDays] = useState("");
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [docTask, setDocTask] = useState<any>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);

  // ───── DATA LOADING ─────
  const fetchAll = async () => {
    const { data: t } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (t) {
      // Auto-flag at 30% remaining
      for (const task of t) {
        if (
          task.status === "in_progress" &&
          task.started_at &&
          task.estimated_days &&
          !task.needs_attention
        ) {
          const elapsedMs = Date.now() - new Date(task.started_at).getTime();
          const totalMs = task.estimated_days * 24 * 60 * 60 * 1000;
          const remainingPct = (totalMs - elapsedMs) / totalMs;
          if (remainingPct <= 0.3) {
            await supabase
              .from("tasks")
              .update({ needs_attention: true })
              .eq("id", task.id);
            task.needs_attention = true;
            await supabase.from("task_notes").insert({
              task_id: task.id,
              author_email: "system",
              note: "🚨 AUTO-ALERT: Only 30% of estimated time remains. Management notified.",
            });
          }
        }
      }
      setTasks(t);
    }

    const { data: n } = await supabase
      .from("task_notes")
      .select("*")
      .order("created_at", { ascending: true });
    if (n) {
      const g: Record<string, any[]> = {};
      n.forEach((x) => {
        (g[x.task_id] ||= []).push(x);
      });
      setNotes(g);
    }

    const { data: d } = await supabase
      .from("task_documents")
      .select("*")
      .order("created_at", { ascending: true });
    if (d) {
      const g: Record<string, any[]> = {};
      d.forEach((x) => {
        (g[x.task_id] ||= []).push(x);
      });
      setDocuments(g);
    }
  };

  const loadClockState = async () => {
    const { data: openSession } = await supabase
      .from("clock_sessions")
      .select("*")
      .eq("user_id", userId)
      .is("clock_out_at", null)
      .order("clock_in_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (openSession) {
      setClockedIn(true);
      setActiveSessionId(openSession.id);
      const elapsed = Math.floor(
        (Date.now() - new Date(openSession.clock_in_at).getTime()) / 1000
      );
      setTimeSecs(elapsed > 0 ? elapsed : 0);
    } else {
      setClockedIn(false);
      setActiveSessionId(null);
      setTimeSecs(0);
    }

    const { data: recent } = await supabase
      .from("clock_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("clock_in_at", { ascending: false })
      .limit(10);
    setSessions(recent || []);
  };

  useEffect(() => {
    if (userId) {
      fetchAll();
      loadClockState();
    }
  }, [userId]);

  useEffect(() => {
    let i: NodeJS.Timeout;
    if (clockedIn) i = setInterval(() => setTimeSecs((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [clockedIn]);

  useEffect(() => {
    setDateLine(
      new Date().toLocaleDateString("en-KE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  // ───── CLOCK-IN ─────
  const toggleClock = async () => {
    if (clockedIn && activeSessionId) {
      const totalSecs = timeSecs;
      const { error } = await supabase
        .from("clock_sessions")
        .update({
          clock_out_at: new Date().toISOString(),
          total_seconds: totalSecs,
        })
        .eq("id", activeSessionId);

      if (!error) {
        setClockedIn(false);
        setActiveSessionId(null);
        setTimeSecs(0);
        showToast(`Clocked out — session ${fmt(totalSecs)} saved ✓`);
        loadClockState();
      } else {
        showToast("Error clocking out: " + error.message);
      }
    } else {
      const { data, error } = await supabase
        .from("clock_sessions")
        .insert({
          user_id: userId,
          user_email: userEmail,
          clock_in_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        setClockedIn(true);
        setActiveSessionId(data.id);
        setTimeSecs(0);
        showToast("Clocked in — session started 👋");
      } else {
        showToast("Error clocking in: " + (error?.message || "unknown"));
      }
    }
  };

  // ───── TASK ACTIONS ─────
  const approveTask = async () => {
    if (!approveModal) return;
    const days = Number(approveDays) || approveModal.proposed_days;
    await supabase
      .from("tasks")
      .update({
        status: "todo",
        estimated_days: days,
        approved_by: userEmail,
        approved_at: new Date().toISOString(),
      })
      .eq("id", approveModal.id);
    await supabase.from("task_notes").insert({
      task_id: approveModal.id,
      author_email: userEmail,
      note: `✅ Estimate approved: ${days} day(s) by ${userEmail}.`,
    });
    setApproveModal(null);
    setApproveDays("");
    fetchAll();
    showToast(`Task approved — ${days} day(s) locked`);
  };

  const startTask = async (task: any) => {
    if (!task.assignee_email) return showToast("⚠️ Cannot start — no assignee");
    const dueAt = new Date(
      Date.now() + (task.estimated_days || 1) * 24 * 60 * 60 * 1000
    ).toISOString();
    await supabase
      .from("tasks")
      .update({
        status: "in_progress",
        started_at: new Date().toISOString(),
        due_at: dueAt,
      })
      .eq("id", task.id);
    fetchAll();
    showToast("Task started ▶");
  };

  const addNote = async () => {
    if (!noteText.trim() || !noteTask) return;
    await supabase.from("task_notes").insert({
      task_id: noteTask.id,
      author_email: userEmail,
      note: noteText,
    });
    setNoteTask(null);
    setNoteText("");
    fetchAll();
    showToast("Progress note saved ✓");
  };

  const seekIntervention = async (task: any) => {
    await supabase
      .from("tasks")
      .update({ intervention_requested: true, needs_attention: true })
      .eq("id", task.id);
    await supabase.from("task_notes").insert({
      task_id: task.id,
      author_email: userEmail,
      note: `🚨 INTERVENTION REQUESTED by ${userEmail}.`,
    });
    fetchAll();
    showToast("Management notified 🚨");
  };

  const postForReview = async (task: any) => {
    await supabase
      .from("tasks")
      .update({ status: "in_review" })
      .eq("id", task.id);
    await supabase.from("task_notes").insert({
      task_id: task.id,
      author_email: userEmail,
      note: `📤 Posted for review.`,
    });
    fetchAll();
    showToast("Task posted for review");
  };

  const approveComplete = async (task: any) => {
    await supabase
      .from("tasks")
      .update({
        status: "complete",
        completed_at: new Date().toISOString(),
        needs_attention: false,
        intervention_requested: false,
      })
      .eq("id", task.id);
    await supabase.from("task_notes").insert({
      task_id: task.id,
      author_email: userEmail,
      note: `✅ Marked complete.`,
    });
    fetchAll();
    showToast("Task approved & complete ✅");
  };

  const sendBack = async (task: any) => {
    await supabase
      .from("tasks")
      .update({ status: "in_progress" })
      .eq("id", task.id);
    await supabase.from("task_notes").insert({
      task_id: task.id,
      author_email: userEmail,
      note: `↩️ Sent back for revision.`,
    });
    fetchAll();
    showToast("Sent back to In Progress");
  };

  const openDoc = async (d: any) => {
    if (d.file_url?.startsWith("http")) {
      window.open(d.file_url, "_blank");
      return;
    }
    const { data, error } = await supabase.storage
      .from("task-documents")
      .createSignedUrl(d.file_url, 60);
    if (error || !data) return showToast("Could not open file");
    window.open(data.signedUrl, "_blank");
  };

  // ───── RENDER ─────
  if (profileLoading) return null;

  const myTasks = tasks.filter(
    (t) => t.assignee_email === userEmail && t.status !== "complete"
  );
  const myUrgent = myTasks.filter((t) =>
    ["overdue", "today", "soon"].includes(getUrgency(t) || "")
  );
  const myInProgress = myTasks.filter((t) => t.status === "in_progress");
  const myInReview = myTasks.filter((t) => t.status === "in_review");
  const myTodo = myTasks.filter((t) => t.status === "todo");

  const allNeedsAttention = tasks.filter((t) => t.needs_attention);
  const allOverdue = tasks.filter(
    (t) => getUrgency(t) === "overdue" && t.status !== "complete"
  );
  const pendingApproval = tasks.filter((t) => t.status === "pending_approval");
  const inReview = tasks.filter((t) => t.status === "in_review");

  return (
    <>
      {isApprover ? (
        <ManagementView
          needsAttention={allNeedsAttention}
          overdue={allOverdue}
          pendingApproval={pendingApproval}
          inReview={inReview}
          tasks={tasks}
        />
      ) : (
        <PersonalView
          myTasks={myTasks}
          myUrgent={myUrgent}
          myInProgress={myInProgress}
          myInReview={myInReview}
          myTodo={myTodo}
          clockedIn={clockedIn}
          timeSecs={timeSecs}
          dateLine={dateLine}
          tz={tz}
          onToggleClock={toggleClock}
          sessions={sessions}
          tasks={tasks}
          notes={notes}
          documents={documents}
          isApprover={isApprover}
          onStart={startTask}
          onReview={(t: any) => {
            setApproveModal(t);
            setApproveDays(String(t.proposed_days));
          }}
          onAddNote={(t: any) => {
            setNoteTask(t);
            setNoteText("");
          }}
          onIntervene={seekIntervention}
          onPostReview={postForReview}
          onApproveComplete={approveComplete}
          onSendBack={sendBack}
          onAttach={(t: any) => {
            setDocTask(t);
            setDocFile(null);
            setShowDocUpload(true);
          }}
          onOpenDoc={openDoc}
        />
      )}

      {/* Note modal */}
      {noteTask && (
        <div className="modal-overlay" onClick={() => setNoteTask(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>Add Progress Update</h3>
                <p>{noteTask.title}</p>
              </div>
              <button className="modal-close" onClick={() => setNoteTask(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Latest update</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="What's the latest?"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
              {(notes[noteTask.id] || []).length > 0 && (
                <div style={{ marginTop: 16, maxHeight: 180, overflowY: "auto" }}>
                  <div className="form-section-title">📝 Previous updates</div>
                  {(notes[noteTask.id] || [])
                    .slice()
                    .reverse()
                    .map((n) => (
                      <div
                        key={n.id}
                        style={{
                          fontSize: ".75rem",
                          padding: "8px 10px",
                          background: "#f9fafb",
                          borderRadius: 6,
                          marginBottom: 6,
                          color: "#333",
                        }}
                      >
                        <b>{n.author_email}</b> ·{" "}
                        {new Date(n.created_at).toLocaleString()}
                        <br />
                        {n.note}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: "center", color: "#111", borderColor: "#ddd" }}
                onClick={() => setNoteTask(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-lime"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={addNote}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve modal */}
      {approveModal && (
        <div className="modal-overlay" onClick={() => setApproveModal(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>Review Time Estimate</h3>
                <p>Adjust the duration before approving.</p>
              </div>
              <button className="modal-close" onClick={() => setApproveModal(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Task</label>
                <div
                  style={{
                    padding: "10px 12px",
                    background: "#f9fafb",
                    borderRadius: 8,
                    fontSize: ".85rem",
                    color: "#333",
                  }}
                >
                  {approveModal.title}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Proposed by {approveModal.created_by_name || approveModal.created_by}
                </label>
                <div
                  style={{
                    padding: "10px 12px",
                    background: "#fef3c7",
                    borderRadius: 8,
                    fontSize: ".85rem",
                    color: "#78350f",
                  }}
                >
                  {approveModal.proposed_days} day(s)
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Your approved duration (days)<span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={approveDays}
                  onChange={(e) => setApproveDays(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: "center", color: "#111", borderColor: "#ddd" }}
                onClick={() => setApproveModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-lime"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={approveTask}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </>
  );
}

function fmt(s: number) {
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(
    Math.floor((s % 3600) / 60)
  ).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function fmtHrs(s: number) {
  return s ? `${(s / 3600).toFixed(2)} hrs` : "---";
}

// ──────── MANAGEMENT VIEW ────────
function ManagementView({
  needsAttention,
  overdue,
  pendingApproval,
  inReview,
  tasks,
}: any) {
  // Compute projects
  const map: Record<string, any[]> = {};
  tasks.forEach((t: any) => {
    if (t.task_type === "project" && t.project_name) {
      (map[t.project_name] ||= []).push(t);
    }
  });
  const projects = Object.entries(map).map(([name, list]) => ({
    name,
    tasks: list,
    total: list.length,
    inProgress: list.filter((t) => t.status === "in_progress").length,
    inReview: list.filter((t) => t.status === "in_review").length,
    complete: list.filter((t) => t.status === "complete").length,
    attention: list.filter((t) => t.needs_attention).length,
    progressPct: list.length
      ? Math.round(
          (list.filter((t) => t.status === "complete").length / list.length) * 100
        )
      : 0,
  }));

  return (
    <div>
      <div className="mgmt-panel">
        <h2>👔 Management Overview</h2>
        <p className="mgmt-subtitle">Here's what needs your attention right now.</p>
        <div className="mgmt-kpis">
          <div
            className={`mgmt-kpi ${needsAttention.length > 0 ? "alert" : "good"}`}
          >
            <span>Needs Attention</span>
            <b>{needsAttention.length}</b>
          </div>
          <div className={`mgmt-kpi ${overdue.length > 0 ? "alert" : "good"}`}>
            <span>Overdue</span>
            <b>{overdue.length}</b>
          </div>
          <div
            className={`mgmt-kpi ${pendingApproval.length > 0 ? "warning" : "good"}`}
          >
            <span>Awaiting Approval</span>
            <b>{pendingApproval.length}</b>
          </div>
          <div className={`mgmt-kpi ${inReview.length > 0 ? "warning" : "good"}`}>
            <span>Awaiting Review</span>
            <b>{inReview.length}</b>
          </div>
          <div className="mgmt-kpi">
            <span>Active Projects</span>
            <b>{projects.length}</b>
          </div>
          <div className="mgmt-kpi">
            <span>Total Tasks</span>
            <b>{tasks.length}</b>
          </div>
        </div>
      </div>

      {needsAttention.length > 0 && (
        <div
          className="panel"
          style={{ marginTop: 20, borderLeft: "4px solid #ef4444" }}
        >
          <h3>🚨 Needs Immediate Attention</h3>
          {needsAttention.slice(0, 5).map((t: any) => (
            <div key={t.id} className="meet" style={{ marginTop: 10 }}>
              <div>
                <b>{t.title}</b>
                <small>
                  {t.assignee_name || "Unassigned"} ·{" "}
                  {t.project_name || t.department} · {t.status}
                </small>
              </div>
              <a
                className="btn btn-green"
                href="/team/tasks?filter=attention"
                style={{ padding: "6px 14px", fontSize: ".75rem" }}
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="panel" style={{ marginTop: 20 }}>
          <h3>🗂 Active Projects</h3>
          <div className="projects-grid" style={{ marginTop: 16 }}>
            {projects.slice(0, 6).map((p) => (
              <div key={p.name} className="project-card">
                <h3>{p.name}</h3>
                <div className="proj-meta">
                  {p.total} task(s) · {p.inProgress} active
                </div>
                <div className="project-stats">
                  <div className="project-stat">
                    <b>{p.inProgress}</b>
                    <span>Active</span>
                  </div>
                  <div className="project-stat">
                    <b>{p.inReview}</b>
                    <span>Review</span>
                  </div>
                  <div className="project-stat">
                    <b>{p.complete}</b>
                    <span>Done</span>
                  </div>
                  <div
                    className={`project-stat ${p.attention > 0 ? "attention" : ""}`}
                  >
                    <b>{p.attention}</b>
                    <span>Flag</span>
                  </div>
                </div>
                <div className="project-progress-bar">
                  <i style={{ width: `${p.progressPct}%` }}></i>
                </div>
                <a
                  className="btn btn-ghost btn-block"
                  href={`/team/tasks?project=${encodeURIComponent(p.name)}`}
                  style={{ justifyContent: "center" }}
                >
                  View Tasks
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────── PERSONAL VIEW ────────
function PersonalView({
  myTasks,
  myUrgent,
  myInProgress,
  myInReview,
  myTodo,
  clockedIn,
  timeSecs,
  dateLine,
  tz,
  onToggleClock,
  sessions,
  notes,
  documents,
  isApprover,
  onStart,
  onReview,
  onAddNote,
  onIntervene,
  onPostReview,
  onApproveComplete,
  onSendBack,
  onAttach,
  onOpenDoc,
}: any) {
  const today = new Date().toDateString();
  const todaySecs = sessions
    .filter(
      (s: any) =>
        s.clock_out_at && new Date(s.clock_in_at).toDateString() === today
    )
    .reduce((a: number, s: any) => a + (s.total_seconds || 0), 0);
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekSecs = sessions
    .filter(
      (s: any) =>
        s.clock_out_at && new Date(s.clock_in_at).getTime() >= weekStart
    )
    .reduce((a: number, s: any) => a + (s.total_seconds || 0), 0);

  return (
    <div>
      <div className="clock-card">
        <div>
          <div className="clock-time">{fmt(timeSecs)}</div>
          <small style={{ color: "rgba(255,255,255,.55)" }}>{dateLine}</small>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700, color: "#fff" }}>
            {clockedIn ? "You are clocked in" : "You are clocked out"}
          </div>
          <small style={{ color: "rgba(255,255,255,.55)" }}>
            {clockedIn ? "Session running" : "Ready to start"}
          </small>
          <div className="clock-tz">
            🌍 {tz.label}: <b>{fmtInTz(new Date(), tz.tz)}</b>
          </div>
        </div>
        <button
          className={`btn ${clockedIn ? "btn-ghost" : "btn-lime"}`}
          onClick={onToggleClock}
        >
          {clockedIn ? "⏹ Clock Out" : "⏱ Clock In"}
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span>My open tasks</span>
          <b>{myTasks.length}</b>
          <small className="up">Assigned to you</small>
        </div>
        <div className="kpi">
          <span>Urgent</span>
          <b>{myUrgent.length}</b>
          <small className="down">Due soon/overdue</small>
        </div>
        <div className="kpi">
          <span>In progress</span>
          <b>{myInProgress.length}</b>
          <small>Currently working</small>
        </div>
        <div className="kpi">
          <span>Awaiting review</span>
          <b>{myInReview.length}</b>
          <small>With management</small>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3>🕐 My Clock-In History</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginTop: 14,
          }}
        >
          <div className="mgmt-kpi">
            <span>Today</span>
            <b>{fmtHrs(todaySecs)}</b>
          </div>
          <div className="mgmt-kpi">
            <span>Last 7 days</span>
            <b>{fmtHrs(weekSecs)}</b>
          </div>
          <div className="mgmt-kpi">
            <span>Sessions logged</span>
            <b>{sessions.filter((s: any) => s.clock_out_at).length}</b>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          {sessions.slice(0, 8).map((s: any) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,.06)",
                fontSize: ".8rem",
              }}
            >
              <span style={{ color: "rgba(255,255,255,.7)" }}>
                {new Date(s.clock_in_at).toLocaleString("en-KE", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
              <span style={{ color: s.clock_out_at ? "#a3e635" : "#fbbf24" }}>
                {s.clock_out_at ? fmtHrs(s.total_seconds || 0) : "⏱ Active now"}
              </span>
            </div>
          ))}
          {sessions.length === 0 && (
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".8rem" }}>
              No sessions logged yet.
            </p>
          )}
        </div>
      </div>

      {myUrgent.length > 0 && (
        <div
          className="panel"
          style={{ marginTop: 20, borderLeft: "4px solid #f59e0b" }}
        >
          <h3>⚡ Urgent — Due Soon</h3>
          {myUrgent.slice(0, 5).map((t: any) => {
            const rem = remainingInfo(t);
            return (
              <div key={t.id} className="meet" style={{ marginTop: 10 }}>
                <div>
                  <b>{t.title}</b>
                  <small>
                    {rem ? rem.label : "Awaiting start"} ·{" "}
                    {t.project_name || t.department}
                  </small>
                </div>
                <a
                  className="btn btn-green"
                  href="/team/tasks?filter=mine"
                  style={{ padding: "6px 14px", fontSize: ".75rem" }}
                >
                  Open
                </a>
              </div>
            );
          })}
        </div>
      )}

      <div className="two-col">
        <div className="panel">
          <h3>🎯 My In Progress</h3>
          {myInProgress.length === 0 && (
            <p
              style={{
                color: "rgba(255,255,255,.5)",
                marginTop: 12,
                fontSize: ".85rem",
              }}
            >
              No active tasks right now.
            </p>
          )}
          {myInProgress.map((t: any) => (
            <TaskCard
              key={t.id}
              task={t}
              notes={notes}
              documents={documents}
              isApprover={isApprover}
              onStart={onStart}
              onReview={onReview}
              onAddNote={onAddNote}
              onIntervene={onIntervene}
              onPostReview={onPostReview}
              onApproveComplete={onApproveComplete}
              onSendBack={onSendBack}
              onAttach={onAttach}
              onOpenDoc={onOpenDoc}
            />
          ))}
        </div>

        <div className="panel">
          <h3>📋 My To Do</h3>
          {myTodo.length === 0 && (
            <p
              style={{
                color: "rgba(255,255,255,.5)",
                marginTop: 12,
                fontSize: ".85rem",
              }}
            >
              Nothing pending.
            </p>
          )}
          {myTodo.slice(0, 5).map((t: any) => (
            <TaskCard
              key={t.id}
              task={t}
              notes={notes}
              documents={documents}
              isApprover={isApprover}
              onStart={onStart}
              onReview={onReview}
              onAddNote={onAddNote}
              onIntervene={onIntervene}
              onPostReview={onPostReview}
              onApproveComplete={onApproveComplete}
              onSendBack={onSendBack}
              onAttach={onAttach}
              onOpenDoc={onOpenDoc}
            />
          ))}
        </div>
      </div>
    </div>
  );
}