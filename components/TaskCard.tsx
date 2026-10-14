"use client";

interface TaskCardProps {
  task: any;
  notes?: Record<string, any[]>;
  documents?: Record<string, any[]>;
  isApprover?: boolean;
  onStart?: (task: any) => void;
  onReview?: (task: any) => void;
  onAddNote?: (task: any) => void;
  onIntervene?: (task: any) => void;
  onPostReview?: (task: any) => void;
  onApproveComplete?: (task: any) => void;
  onSendBack?: (task: any) => void;
  onAttach?: (task: any) => void;
  onOpenDoc?: (doc: any) => void;
}

export function getUrgency(task: any): string | null {
  if (task.status === "complete") return null;
  if (!task.due_at && !task.started_at) {
    if (task.priority === "urgent") return "overdue";
    if (task.priority === "high") return "high";
    return null;
  }
  const due = task.due_at ? new Date(task.due_at).getTime() : null;
  if (!due) return task.priority === "urgent" ? "overdue" : null;
  const remainMs = due - Date.now();
  const hours = remainMs / (1000 * 60 * 60);
  if (remainMs < 0) return "overdue";
  if (hours < 24) return "today";
  if (hours < 72) return "soon";
  return null;
}

export function remainingInfo(task: any) {
  if (!task.started_at || !task.estimated_days) return null;
  const elapsedMs = Date.now() - new Date(task.started_at).getTime();
  const totalMs = task.estimated_days * 24 * 60 * 60 * 1000;
  const remainMs = totalMs - elapsedMs;
  const pct = Math.max(0, Math.min(100, (remainMs / totalMs) * 100));
  const days = Math.floor(remainMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remainMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return {
    pct,
    label: remainMs <= 0 ? "Overdue" : `${days}d ${hours}h left`,
    overdue: remainMs <= 0,
    remainMs,
  };
}

export function fmtSize(bytes?: number | null) {
  if (bytes === undefined || bytes === null) return "---";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function TaskCard({
  task,
  notes = {},
  documents = {},
  isApprover = false,
  onStart,
  onReview,
  onAddNote,
  onIntervene,
  onPostReview,
  onApproveComplete,
  onSendBack,
  onAttach,
  onOpenDoc,
}: TaskCardProps) {
  const taskNotes = notes[task.id] || [];
  const taskDocs = documents[task.id] || [];
  const latestNote = taskNotes[taskNotes.length - 1];
  const rem = task.status === "in_progress" ? remainingInfo(task) : null;
  const flagged = task.needs_attention;
  const urgency = getUrgency(task);
  const typeClass = task.task_type === "project" ? "type-project" : "type-admin";
  const cardClass = flagged
    ? "urgent"
    : urgency === "overdue" || urgency === "today"
    ? "urgent"
    : urgency === "soon" || urgency === "high"
    ? "high"
    : "";

  const urgencyLabel =
    urgency === "overdue"
      ? "Overdue"
      : urgency === "today"
      ? "Due today"
      : urgency === "soon"
      ? "Due soon"
      : urgency === "high"
      ? "High priority"
      : null;

  return (
    <div className={`task task-with-popover ${cardClass}`}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <b style={{ flex: 1, fontSize: ".88rem", lineHeight: 1.35 }}>
          {task.title}
        </b>
        {flagged && (
          <span
            style={{
              background: "#ef4444",
              color: "#fff",
              fontSize: ".6rem",
              padding: "2px 6px",
              borderRadius: 4,
              fontWeight: 700,
            }}
          >
            ⚠
          </span>
        )}
      </div>

      {urgencyLabel && (
        <span
          className={`urgency-strip urgency-${
            urgency === "overdue"
              ? "overdue"
              : urgency === "today"
              ? "today"
              : "soon"
          }`}
          style={{ marginTop: 6 }}
        >
          {urgencyLabel}
        </span>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <span className={`task-type-badge ${typeClass}`}>
          {task.task_type === "project" ? "🌐 Project" : "⚙ Admin"}
        </span>
        {task.task_type === "project" && task.project_name && (
          <span
            style={{
              fontSize: ".68rem",
              color: "rgba(255,255,255,.6)",
              padding: "2px 0",
            }}
          >
            {task.project_name}
          </span>
        )}
      </div>

      <small
        style={{
          display: "block",
          marginTop: 8,
          color: "rgba(255,255,255,.5)",
          fontSize: ".72rem",
        }}
      >
        👤 {task.assignee_name || task.assignee_email || (
          <span style={{ color: "#f87171" }}>Unassigned</span>
        )}
      </small>

      {task.status === "pending_approval" && (
        <>
          <small
            style={{
              display: "block",
              marginTop: 10,
              color: "#fbbf24",
              fontSize: ".72rem",
            }}
          >
            Proposed: <b>{task.proposed_days} day(s)</b>
          </small>
          {isApprover ? (
            <button
              onClick={() => onReview?.(task)}
              className="btn btn-green"
              style={{
                width: "100%",
                marginTop: 10,
                padding: 6,
                fontSize: ".75rem",
                justifyContent: "center",
              }}
            >
              ✓ Review
            </button>
          ) : (
            <div
              style={{
                marginTop: 10,
                fontSize: ".7rem",
                color: "rgba(255,255,255,.5)",
                textAlign: "center",
                padding: 6,
                background: "rgba(255,255,255,.04)",
                borderRadius: 6,
              }}
            >
              Awaiting approval
            </div>
          )}
        </>
      )}

      {task.status === "todo" && (
        <>
          <small
            style={{
              display: "block",
              marginTop: 10,
              color: "#60a5fa",
              fontSize: ".72rem",
            }}
          >
            Estimate: <b>{task.estimated_days} day(s)</b>
          </small>
          {task.assignee_email ? (
            <button
              onClick={() => onStart?.(task)}
              className="btn btn-lime"
              style={{
                width: "100%",
                marginTop: 10,
                padding: 6,
                fontSize: ".75rem",
                justifyContent: "center",
              }}
            >
              ▶ Start
            </button>
          ) : (
            <div className="task-warning">⚠ No assignee</div>
          )}
        </>
      )}

      {task.status === "in_progress" && rem && (
        <>
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: ".68rem",
                color: rem.overdue
                  ? "#ef4444"
                  : rem.pct < 30
                  ? "#fbbf24"
                  : "#a3e635",
              }}
            >
              <span>{rem.overdue ? "⚠ OVERDUE" : "⏱ " + rem.label}</span>
              <span>{Math.round(100 - rem.pct)}%</span>
            </div>
            <div className="bar" style={{ marginTop: 4 }}>
              <i
                style={{
                  width: `${100 - rem.pct}%`,
                  background: rem.overdue
                    ? "#ef4444"
                    : rem.pct < 30
                    ? "#fbbf24"
                    : undefined,
                }}
              ></i>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => onAddNote?.(task)}
              className="btn btn-ghost"
              style={{ padding: "5px 8px", fontSize: ".68rem" }}
            >
              📝
            </button>
            <button
              onClick={() => onIntervene?.(task)}
              className="btn-danger"
            >
              🚨
            </button>
            <button
              onClick={() => onPostReview?.(task)}
              className="btn btn-green"
              style={{ padding: "5px 8px", fontSize: ".68rem" }}
            >
              📤
            </button>
          </div>
        </>
      )}

      {task.status === "in_review" && (
        <>
          <small
            style={{
              display: "block",
              marginTop: 8,
              color: "#c4b5fd",
              fontSize: ".72rem",
            }}
          >
            Awaiting approval
          </small>
          {isApprover ? (
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button
                onClick={() => onApproveComplete?.(task)}
                className="btn btn-green"
                style={{
                  flex: 1,
                  padding: 6,
                  fontSize: ".72rem",
                  justifyContent: "center",
                }}
              >
                ✓
              </button>
              <button
                onClick={() => onSendBack?.(task)}
                className="btn btn-ghost"
                style={{
                  flex: 1,
                  padding: 6,
                  fontSize: ".72rem",
                  justifyContent: "center",
                }}
              >
                ↩
              </button>
            </div>
          ) : (
            <div
              style={{
                marginTop: 10,
                fontSize: ".7rem",
                color: "rgba(255,255,255,.5)",
                textAlign: "center",
                padding: 6,
                background: "rgba(255,255,255,.04)",
                borderRadius: 6,
              }}
            >
              Awaiting review
            </div>
          )}
        </>
      )}

      {task.status === "complete" && (
        <>
          <small
            style={{
              display: "block",
              marginTop: 8,
              color: "#4ade80",
              fontSize: ".72rem",
            }}
          >
            ✅{" "}
            {task.completed_at
              ? new Date(task.completed_at).toLocaleDateString()
              : ""}
          </small>
          <button
            onClick={() => onAttach?.(task)}
            className="btn btn-ghost"
            style={{
              width: "100%",
              marginTop: 8,
              padding: 5,
              fontSize: ".68rem",
              justifyContent: "center",
            }}
          >
            📎 Attach
          </button>
          {taskDocs.length > 0 && (
            <div style={{ marginTop: 6, fontSize: ".68rem" }}>
              {taskDocs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onOpenDoc?.(d)}
                  style={{
                    display: "block",
                    background: "none",
                    border: "none",
                    padding: "2px 0",
                    color: "#a3e635",
                    fontSize: ".68rem",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  📄 {d.file_name}{" "}
                  {d.file_size ? `(${fmtSize(d.file_size)})` : ""}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {latestNote && (
        <div
          style={{
            marginTop: 8,
            padding: "5px 7px",
            background: "rgba(255,255,255,.04)",
            borderRadius: 6,
            fontSize: ".68rem",
            color: "rgba(255,255,255,.6)",
          }}
        >
          {latestNote.note.length > 60
            ? latestNote.note.slice(0, 60) + "..."
            : latestNote.note}
        </div>
      )}

      <div className="task-popover">
        <h4>📋 Task Details</h4>
        <div className="pop-section">
          <h4>Description</h4>
          <p>{task.description || "No description provided."}</p>
        </div>
        {task.deliverables && (
          <div className="pop-section">
            <h4>📦 Deliverables</h4>
            <p>{task.deliverables}</p>
          </div>
        )}
        {task.success_criteria && (
          <div className="pop-section">
            <h4>🎯 Success Criteria</h4>
            <p>{task.success_criteria}</p>
          </div>
        )}
        <div className="pop-section">
          <h4>👤 Details</h4>
          <p style={{ fontSize: ".72rem" }}>
            <b>Assigned to:</b>{" "}
            {task.assignee_name || task.assignee_email || "Unassigned"}
            <br />
            <b>Department:</b> {task.department}
            <br />
            <b>Priority:</b> {task.priority}
            <br />
            <b>Created by:</b>{" "}
            {task.created_by_name || task.created_by || "---"}
          </p>
        </div>
      </div>
    </div>
  );
}