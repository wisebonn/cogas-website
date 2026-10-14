"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { EmptyProjects } from "@/components/EmptyState";

export default function ProjectsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("task_type", "project")
        .order("created_at", { ascending: false });
      setTasks(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const map: Record<string, any[]> = {};
  tasks.forEach((t) => {
    if (t.project_name) (map[t.project_name] ||= []).push(t);
  });

  const projects = Object.entries(map)
    .map(([name, list]) => ({
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
    }))
    .sort((a, b) => b.attention - a.attention || b.total - a.total);

  if (loading) return null;

  return (
    <div>
      {projects.length === 0 ? (
        <div className="panel" style={{ marginTop: 0 }}>
          <EmptyProjects />
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <div key={p.name} className="project-card">
              <h3>{p.name}</h3>
              <div className="proj-meta">
                {p.total} task(s) · {p.inProgress} active · {p.complete} complete
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
              <Link
                className="btn btn-lime btn-block"
                href={`/team/tasks?project=${encodeURIComponent(p.name)}`}
                style={{ justifyContent: "center" }}
              >
                View Tasks →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}