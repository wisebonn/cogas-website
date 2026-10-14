"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  /** Emoji or icon — defaults to a sprout */
  icon?: string;
  /** Main headline */
  title: string;
  /** Sub-copy explaining the empty state */
  description?: string;
  /** Optional action button / link */
  action?: ReactNode;
  /** Optional - renders the state on a dark background instead of white */
  dark?: boolean;
  /** Optional - a small hint line under the description */
  hint?: string;
}

export function EmptyState({
  icon = "🌱",
  title,
  description,
  action,
  dark = false,
  hint,
}: EmptyStateProps) {
  return (
    <div
      className={dark ? "empty-state dark" : "empty-state"}
      style={{
        textAlign: "center",
        padding: "56px 24px",
      }}
    >
      <div
        style={{
          fontSize: "3rem",
          marginBottom: 14,
          filter: dark ? "grayscale(.1) brightness(1.1)" : "grayscale(.2)",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontFamily: "var(--font-head)",
          color: dark ? "#fff" : "var(--ink)",
          fontSize: "1.2rem",
          margin: "0 0 8px",
          fontWeight: 600,
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            color: dark ? "rgba(255,255,255,.6)" : "var(--muted)",
            maxWidth: 460,
            margin: "0 auto",
            fontSize: ".9rem",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      )}

      {hint && (
        <p
          style={{
            color: dark ? "rgba(255,255,255,.4)" : "rgba(92,102,95,.75)",
            maxWidth: 420,
            margin: "12px auto 0",
            fontSize: ".78rem",
            fontStyle: "italic",
          }}
        >
          {hint}
        </p>
      )}

      {action && (
        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {action}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Preset empty states for common modules
// ────────────────────────────────────────────────────────────

export function EmptyTasks({ dark = true }: { dark?: boolean }) {
  return (
    <EmptyState
      dark={dark}
      icon="📋"
      title="No tasks yet"
      description="Once you create your first task, it'll appear here for the team to pick up."
      hint="Tip: tasks start in 'Awaiting Approval' before work begins."
    />
  );
}

export function EmptyProjects({ dark = true }: { dark?: boolean }) {
  return (
    <EmptyState
      dark={dark}
      icon="🗂"
      title="No projects yet"
      description="Create a task with type 'Project Task' and give it a project name to start one."
    />
  );
}

export function EmptyClients({ dark = true }: { dark?: boolean }) {
  return (
    <EmptyState
      dark={dark}
      icon="🤝"
      title="No clients yet"
      description="Your first client will appear here once an enquiry is qualified."
      hint="Enquiries from the public contact form land in the pipeline automatically."
    />
  );
}

export function EmptyInvoices({ dark = true }: { dark?: boolean }) {
  return (
    <EmptyState
      dark={dark}
      icon="🧾"
      title="No invoices yet"
      description="Issue your first invoice to a client and track payment status here."
    />
  );
}

export function EmptyDocuments({ dark = true }: { dark?: boolean }) {
  return (
    <EmptyState
      dark={dark}
      icon="📄"
      title="No documents yet"
      description="Upload deliverables from a completed task, or attach files to any project."
    />
  );
}

export function EmptyEnquiries({ dark = true }: { dark?: boolean }) {
  return (
    <EmptyState
      dark={dark}
      icon="📨"
      title="No enquiries in this stage"
      description="Move a lead here when it reaches this stage of your pipeline."
    />
  );
}

export function EmptyMeetings({ dark = true }: { dark?: boolean }) {
  return (
    <EmptyState
      dark={dark}
      icon="📅"
      title="No meetings scheduled"
      description="Upcoming calls with clients and team syncs will appear here."
    />
  );
}

export function EmptyLeave({ dark = true }: { dark?: boolean }) {
  return (
    <EmptyState
      dark={dark}
      icon="🌴"
      title="No leave requests"
      description="Team members can request annual, sick, or other leave from this page."
    />
  );
}

export function EmptyExpenses({ dark = true }: { dark?: boolean }) {
  return (
    <EmptyState
      dark={dark}
      icon="💸"
      title="No expenses logged"
      description="Track field costs, office supplies, travel and reimbursements here."
    />
  );
}

export function EmptyMessages({ dark = true }: { dark?: boolean }) {
  return (
    <EmptyState
      dark={dark}
      icon="💬"
      title="No messages"
      description="Project threads with clients and internal notes will appear here."
    />
  );
}