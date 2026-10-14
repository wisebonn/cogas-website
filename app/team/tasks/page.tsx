"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast } from "@/lib/hooks";
import { TaskCard, getUrgency } from "@/components/TaskCard";
import { Toast } from "@/components/Toast";

const COLS = [
  { key: "pending_approval", label: "⏳ Awaiting Approval", color: "#fbbf24" },
  { key: "todo", label: "📋 To Do", color: "#60a5fa" },
  { key: "in_progress", label: "⚙️ In Progress", color: "#a3e635" },
  { key: "in_review", label: "🔍 In Review", color: "#c4b5fd" },
  { key: "complete", label: "✅ Complete", color: "#4ade80" },
];

const DEPARTMENTS = [
  "Agro-Econ",
  "Actuarial",
  "Marketing",
  "Engineering",
  "Logistics",
  "Finance",
];

function TasksInner() {
  const { userEmail, userId, isApprover } = useProfile();
  const { toastMsg, showToast } = useToast();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, any[]>>({});
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const [filter, setFilter] = useState<"mine" | "all" | "urgent" | "attention">(
    "all"
  );
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deliverables: "",
    success_criteria: "",
    assignee_email: "",
    department: "Agro-Econ",
    proposed_days: 3,
    priority: "normal",
    task_type: "admin",
    project_name: "",
  });

  const [noteTask, setNoteTask] = useState<any>(null);
  const [noteText, setNoteText] = useState("");
  const [approveModal, setApproveModal] = useState<any>(null);
  const [approveDays, setApproveDays] = useState("");

  // URL query params
  useEffect(() => {
    const p = searchParams.get("project");
    const f = searchParams.get("filter") as any;
    if (p) setSelectedProject(p);
    if (f && ["mine", "all", "urgent", "attention"].includes(f)) setFilter(f);
  }, [searchParams]);

  const fetchAll = async () => {
    const { data: t } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (t) setTasks(t);

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

    const { data: p } = await supabase
      .from("profiles")
      .select("id,email,role,full_name")
      .eq("is_approved", true);
    if (p) setTeamMembers(p);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const createTask = async () => {
    if (!newTask.title.trim()) return showToast("Title is required");
    if (!newTask.assignee_email)
      return showToast("Please assign this task to someone");
    if (newTask.task_type === "project" && !newTask.project_name.trim())
      return showToast("Project name is required");

    const member = teamMembers.find((m) => m.email === newTask.assignee_email);
    const myName =
      teamMembers.find((m) => m.email === userEmail)?.full_name || userEmail;

    await supabase.from("tasks").insert({
      title: newTask.title,
      description: newTask.description,
      deliverables: newTask.deliverables,
      success_criteria: newTask.success_criteria,
      assignee_email: newTask.assignee_email,
      assignee_name:
        member?.full_name || member?.email || newTask.assignee_email,
      department: newTask.department,
      proposed_days: Number(newTask.proposed_days),
      priority: newTask.priority,
      task_type: newTask.task_type,
      project_name:
        newTask.task_type === "project" ? newTask.project_name : null,
      created_by: userEmail,
      created_by_name: myName,
      status: "pending_approval",
    });

    setShowNewTask(false);
    setNewTask({
      title: "",
      description: "",
      deliverables: "",
      success_criteria: "",
      assignee_email: "",
      department: "Agro-Econ",
      proposed_days: 3,
      priority: "normal",
      task_type: "admin",
      project_name: "",
    });
    fetchAll();
    showToast("Task created — awaiting approval");
  };

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

  // Filter logic
  let filtered = tasks;
  if (selectedProject) {
    filtered = filtered.filter((t) => t.project_name === selectedProject);
  }
  if (filter === "mine") {
    filtered = filtered.filter((t) => t.assignee_email === userEmail);
  } else if (filter === "urgent") {
    filtered = filtered.filter(
      (t) =>
        ["overdue", "today", "soon"].includes(getUrgency(t) || "") ||
        t.priority === "urgent"
    );
  } else if (filter === "attention") {
    filtered = filtered.filter((t) => t.needs_attention);
  }

  const counts = {
    mine: tasks.filter((t) => t.assignee_email === userEmail).length,
    all: tasks.length,
    urgent: tasks.filter(
      (t) =>
        ["overdue", "today", "soon"].includes(getUrgency(t) || "") ||
        t.priority === "urgent"
    ).length,
    attention: tasks.filter((t) => t.needs_attention).length,
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          className="btn btn-lime"
          onClick={() => setShowNewTask(true)}
        >
          ＋ New Task
        </button>

        {selectedProject && (
          <div
            style={{
              padding: "8px 14px",
              background: "rgba(163,230,53,.15)",
              border: "1px solid rgba(163,230,53,.4)",
              borderRadius: 8,
              color: "#a3e635",
              fontSize: ".8rem",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            🗂 Viewing: <b>{selectedProject}</b>
            <button
              onClick={() => setSelectedProject(null)}
              style={{
                background: "none",
                border: "none",
                color: "#a3e635",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className="filter-tabs">
        {(["mine", "all", "urgent", "attention"] as const).map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "mine" && "👤 My Tasks"}
            {f === "all" && "📋 All Tasks"}
            {f === "urgent" && "⚡ Urgent"}
            {f === "attention" && "🚨 Needs Attention"}
            <span className="count">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
        }}
      >
        {COLS.map((col) => {
          const list = filtered.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="col">
              <h3 style={{ borderBottom: `2px solid ${col.color}`, paddingBottom: 8 }}>
                {col.label} <span>{list.length}</span>
              </h3>
              <div>
                {list.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    notes={notes}
                    documents={documents}
                    isApprover={isApprover}
                    onStart={startTask}
                    onReview={(task) => {
                      setApproveModal(task);
                      setApproveDays(String(task.proposed_days));
                    }}
                    onAddNote={(task) => {
                      setNoteTask(task);
                      setNoteText("");
                    }}
                    onIntervene={seekIntervention}
                    onPostReview={postForReview}
                    onApproveComplete={approveComplete}
                    onSendBack={sendBack}
                    onAttach={() => showToast("Open dashboard to attach documents")}
                    onOpenDoc={openDoc}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showNewTask && (
        <div className="modal-overlay" onClick={() => setShowNewTask(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>Create New Task</h3>
                <p>
                  Fill in the details below. The task will be sent for approval
                  before work begins.
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowNewTask(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <div className="form-section-title">📋 Task Information</div>
                <div className="form-group">
                  <label className="form-label">
                    Task title<span className="required">*</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="e.g., Prepare Nakuru field survey protocol"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="What needs to be done?"
                    rows={2}
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Deliverables</label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g., Report PDF, dataset"
                      rows={2}
                      value={newTask.deliverables}
                      onChange={(e) =>
                        setNewTask({ ...newTask, deliverables: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Success criteria</label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g., Approved by chair"
                      rows={2}
                      value={newTask.success_criteria}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          success_criteria: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">🧭 Task Type</div>
                <div className="radio-group">
                  <label
                    className={`radio-option ${
                      newTask.task_type === "admin" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="task_type"
                      value="admin"
                      checked={newTask.task_type === "admin"}
                      onChange={() =>
                        setNewTask({
                          ...newTask,
                          task_type: "admin",
                          project_name: "",
                        })
                      }
                    />
                    <b>⚙ Admin Task</b>
                    <small>Internal operations</small>
                  </label>
                  <label
                    className={`radio-option ${
                      newTask.task_type === "project" ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="task_type"
                      value="project"
                      checked={newTask.task_type === "project"}
                      onChange={() =>
                        setNewTask({ ...newTask, task_type: "project" })
                      }
                    />
                    <b>🌐 Project Task</b>
                    <small>Client work</small>
                  </label>
                </div>
                {newTask.task_type === "project" && (
                  <div className="form-group" style={{ marginTop: 14 }}>
                    <label className="form-label">
                      Project name<span className="required">*</span>
                    </label>
                    <input
                      className="form-input"
                      placeholder="e.g., Greenhouse Feasibility — Nakuru"
                      value={newTask.project_name}
                      onChange={(e) =>
                        setNewTask({ ...newTask, project_name: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="form-section">
                <div className="form-section-title">👤 Assignment</div>
                <div className="form-group">
                  <label className="form-label">
                    Assign to<span className="required">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={newTask.assignee_email}
                    onChange={(e) =>
                      setNewTask({ ...newTask, assignee_email: e.target.value })
                    }
                  >
                    <option value="">--- Select a team member ---</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.email}>
                        {m.full_name || m.email} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={newTask.department}
                    onChange={(e) =>
                      setNewTask({ ...newTask, department: e.target.value })
                    }
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">⏱ Time & Priority</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Proposed duration (days)
                      <span className="required">*</span>
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={newTask.proposed_days}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          proposed_days: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask({ ...newTask, priority: e.target.value })
                      }
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="info-banner">
                <b>ⓘ Approval required.</b> This task will be sent to the chair /
                co-chair.
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: "center", color: "#111", borderColor: "#ddd" }}
                onClick={() => setShowNewTask(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-lime"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={createTask}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
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
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
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

      {/* Approve Modal */}
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
                  Proposed by{" "}
                  {approveModal.created_by_name || approveModal.created_by}
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
                  Your approved duration (days)
                  <span className="required">*</span>
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
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div style={{ color: "#fff" }}>Loading...</div>}>
      <TasksInner />
    </Suspense>
  );
}