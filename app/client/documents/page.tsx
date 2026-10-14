"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast } from "@/lib/hooks";
import { EmptyDocuments } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";

export default function ClientDocumentsPage() {
  const { userEmail } = useProfile();
  const { toastMsg, showToast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    const load = async () => {
      const { data: tasks } = await supabase.from("tasks").select("id, title").eq("client_email", userEmail);
      const taskIds = (tasks || []).map((t) => t.id);
      if (taskIds.length === 0) { setLoading(false); return; }
      const { data } = await supabase
        .from("task_documents")
        .select("*")
        .in("task_id", taskIds)
        .order("created_at", { ascending: false });
      const enriched = (data || []).map((d) => ({ ...d, task: tasks?.find((t) => t.id === d.task_id) }));
      setDocs(enriched);
      setLoading(false);
    };
    load();
  }, [userEmail]);

  const open = async (d: any) => {
    if (d.file_url?.startsWith("http")) { window.open(d.file_url, "_blank"); return; }
    const { data, error } = await supabase.storage.from("task-documents").createSignedUrl(d.file_url, 60);
    if (error || !data) return showToast("Could not open file");
    window.open(data.signedUrl, "_blank");
  };

  if (loading) return null;

  return (
    <div className="panel" style={{ marginTop: 0 }}>
      <h3>📄 Your documents</h3>
      {docs.length === 0 ? (
        <EmptyDocuments />
      ) : (
        <table style={{ marginTop: 14 }}>
          <thead>
            <tr><th>Document</th><th>Milestone</th><th>Size</th><th>Date</th></tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td>
                  <button onClick={() => open(d)} style={{ background: "none", border: "none", color: "#a3e635", cursor: "pointer", fontWeight: 600 }}>
                    📄 {d.file_name}
                  </button>
                </td>
                <td style={{ fontSize: ".82rem" }}>{d.task?.title || "---"}</td>
                <td style={{ fontSize: ".82rem" }}>{d.file_size ? `${(d.file_size / 1024 / 1024).toFixed(1)} MB` : "---"}</td>
                <td style={{ fontSize: ".82rem" }}>{new Date(d.created_at).toLocaleDateString("en-KE", { dateStyle: "short" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Toast message={toastMsg} />
    </div>
  );
}