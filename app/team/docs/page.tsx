"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast } from "@/lib/hooks";
import { EmptyDocuments } from "@/components/EmptyState";
import { fmtSize } from "@/components/TaskCard";
import { Toast } from "@/components/Toast";

export default function DocsPage() {
  const { userEmail, isApprover } = useProfile();
  const { toastMsg, showToast } = useToast();
  const [documents, setDocuments] = useState<Record<string, any[]>>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [d, t] = await Promise.all([
      supabase.from("task_documents").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("id, title, project_name"),
    ]);
    const g: Record<string, any[]> = {};
    (d.data || []).forEach((x) => {
      (g[x.task_id] ||= []).push(x);
    });
    setDocuments(g);
    setTasks(t.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const open = async (d: any) => {
    if (d.file_url?.startsWith("http")) { window.open(d.file_url, "_blank"); return; }
    const { data, error } = await supabase.storage.from("task-documents").createSignedUrl(d.file_url, 60);
    if (error || !data) return showToast("Could not open file");
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (d: any) => {
    if (!confirm(`Delete "${d.file_name}"?`)) return;
    if (!d.file_url?.startsWith("http")) {
      await supabase.storage.from("task-documents").remove([d.file_url]);
    }
    await supabase.from("task_documents").delete().eq("id", d.id);
    load();
    showToast("Deleted");
  };

  if (loading) return null;

  const allDocs = Object.entries(documents)
    .flatMap(([tid, docs]) =>
      (docs as any[]).map((d) => ({ ...d, task: tasks.find((t) => t.id === tid) }))
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="panel" style={{ marginTop: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ margin: 0 }}>
          📁 Document Vault{" "}
          <span style={{ color: "rgba(255,255,255,.5)", fontSize: ".8rem", fontWeight: 400 }}>
            ({allDocs.length} file{allDocs.length === 1 ? "" : "s"} · private storage)
          </span>
        </h3>
      </div>

      {allDocs.length === 0 ? (
        <EmptyDocuments />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Task / Project</th>
                <th>Size</th>
                <th>Uploaded by</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allDocs.map((d) => (
                <tr key={d.id}>
                  <td>
                    <button
                      onClick={() => open(d)}
                      style={{ background: "none", border: "none", color: "#a3e635", cursor: "pointer", fontSize: ".86rem", textAlign: "left", padding: 0, fontWeight: 600 }}
                    >
                      📄 {d.file_name}
                    </button>
                  </td>
                  <td>
                    <div style={{ fontSize: ".84rem" }}>{d.task?.title || "---"}</div>
                    {d.task?.project_name && (
                      <small style={{ color: "rgba(255,255,255,.5)" }}>{d.task.project_name}</small>
                    )}
                  </td>
                  <td>{fmtSize(d.file_size)}</td>
                  <td style={{ fontSize: ".8rem" }}>{d.uploaded_by}</td>
                  <td style={{ fontSize: ".8rem" }}>
                    {new Date(d.created_at).toLocaleDateString("en-KE", { dateStyle: "short" })}
                  </td>
                  <td>
                    {(isApprover || d.uploaded_by === userEmail) && (
                      <button
                        onClick={() => remove(d)}
                        className="btn-danger"
                        style={{ padding: "4px 10px", fontSize: ".68rem" }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Toast message={toastMsg} />
    </div>
  );
}