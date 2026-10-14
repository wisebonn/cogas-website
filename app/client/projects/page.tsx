"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/lib/hooks";
import { EmptyState } from "@/components/EmptyState";

export default function ClientProjectsPage() {
  const { userEmail } = useProfile();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!userEmail) return;
    const load = async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_email", userEmail)
        .order("created_at", { ascending: false });
      setTasks(data || []);
      setLoading(false);
    };
    load();
  }, [userEmail]);

  if (loading) return null;

  const map: Record<string, any[]> = {};
  tasks.forEach((t) => { if (t.project_name) (map[t.project_name] ||= []).push(t); });

  const projects = Object.entries(map).map(([name, list]) => ({
    name,
    tasks: list,
    total: list.length,
    complete: list.filter((t) => t.status === "complete").length,
    inProgress: list.filter((t) => t.status === "in_progress").length,
    progressPct: list.length ? Math.round((list.filter((t) => t.status === "complete").length / list.length) * 100) : 0,
  }));

  if (selected) {
    const project = projects.find((p) => p.name === selected);
    if (!project) return null;
    return (
      <div>
        <button className="btn btn-ghost" style={{ marginBottom: 20, borderColor: "rgba(255,255,255,.2)" }} onClick={() => setSelected(null)}>
          ← Back to all projects
        </button>
        <div className="module-hero" style={{ minHeight: 140 }}>
          <div>
            <h2>{project.name}</h2>
            <p>{project.total} milestones · {project.progressPct}% complete</p>
          </div>
        </div>
        <div className="panel" style={{ marginTop: 20 }}>
          {project.tasks.map((t) => (
            <div key={t.id} className="meet">
              <div style={{ flex: 1 }}>
                <b>{t.title}</b>
                <small>{t.description || "No description"} · Due {t.due_at ? new Date(t.due_at).toLocaleDateString("en-KE", { dateStyle: "short" }) : "TBD"}</small>
              </div>
              <span className={`pill ${t.status === "complete" ? "pill-green" : "pill-gold"}`} style={{ padding: "4px 12px", borderRadius: 99, fontSize: ".72rem", fontWeight: 700 }}>
                {t.status === "complete" ? "✅ Complete" : t.status === "in_progress" ? "⚙ In Progress" : t.status === "in_review" ? "🔍 In Review" : "📋 To Do"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {projects.length === 0 ? (
        <div className="panel" style={{ marginTop: 0 }}>
          <EmptyState dark icon="🗂" title="No projects yet" description="Your consultant will set these up shortly. You'll see them here as soon as they begin work." />
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <div key={p.name} className="project-card">
              <h3>{p.name}</h3>
              <div className="proj-meta">{p.total} milestone(s) · {p.inProgress} in progress</div>
              <div className="project-progress-bar">
                <i style={{ width: `${p.progressPct}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", color: "rgba(255,255,255,.6)", marginBottom: 10 }}>
                <span>{p.complete} of {p.total} complete</span>
                <span>{p.progressPct}%</span>
              </div>
              <button className="btn btn-lime btn-block" style={{ justifyContent: "center" }} onClick={() => setSelected(p.name)}>
                View Milestones →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}