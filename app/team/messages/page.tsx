"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast } from "@/lib/hooks";
import { EmptyMessages } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";

export default function MessagesPage() {
  const { userEmail } = useProfile();
  const { toastMsg, showToast } = useToast();
  const [threads, setThreads] = useState<Record<string, any[]>>({});
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newThreadKey, setNewThreadKey] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) {
      const g: Record<string, any[]> = {};
      data.forEach((m) => { (g[m.thread_key] ||= []).push(m); });
      setThreads(g);
      if (!activeThread && Object.keys(g).length > 0) setActiveThread(Object.keys(g)[0]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [activeThread, threads]);

  const send = async () => {
    if (!newMessage.trim() || !activeThread) return;
    await supabase.from("messages").insert({
      thread_key: activeThread,
      from_email: userEmail,
      from_name: userEmail,
      body: newMessage,
    });
    setNewMessage("");
    load();
  };

  const createThread = async () => {
    if (!newThreadKey.trim()) return;
    const key = newThreadKey.startsWith("client:") || newThreadKey.startsWith("project:")
      ? newThreadKey
      : `project:${newThreadKey}`;
    setActiveThread(key);
    setNewThreadKey("");
    setShowNewThread(false);
    load();
  };

  if (loading) return null;

  const threadKeys = Object.keys(threads);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, height: "calc(100vh - 160px)" }}>
      <div className="panel" style={{ marginTop: 0, overflowY: "auto", padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, padding: "0 6px" }}>
          <b style={{ color: "#fff", fontSize: ".9rem" }}>Threads</b>
          <button className="btn btn-lime" style={{ padding: "4px 10px", fontSize: ".7rem" }} onClick={() => setShowNewThread(true)}>+ New</button>
        </div>
        {threadKeys.length === 0 && (
          <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".78rem", textAlign: "center", padding: 20 }}>
            No threads yet. Create one.
          </p>
        )}
        {threadKeys.map((key) => {
          const msgs = threads[key];
          const last = msgs[msgs.length - 1];
          const isActive = activeThread === key;
          return (
            <div
              key={key}
              onClick={() => setActiveThread(key)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: isActive ? "rgba(163,230,53,.14)" : "transparent",
                cursor: "pointer",
                marginBottom: 4,
                borderLeft: isActive ? "3px solid #a3e635" : "3px solid transparent",
              }}
            >
              <div style={{ fontSize: ".82rem", fontWeight: 600, color: "#fff", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {key}
              </div>
              <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {last.from_name || last.from_email}: {last.body.slice(0, 40)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel" style={{ marginTop: 0, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        {activeThread ? (
          <>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
              <b style={{ color: "#fff" }}>{activeThread}</b>
            </div>
            <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {threads[activeThread].map((m) => {
                const mine = m.from_email === userEmail;
                return (
                  <div key={m.id} style={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "75%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: mine ? "#166534" : "rgba(255,255,255,.06)",
                    color: "#fff",
                    fontSize: ".85rem",
                    borderBottomRightRadius: mine ? 4 : undefined,
                    borderBottomLeftRadius: !mine ? 4 : undefined,
                  }}>
                    {!mine && <div style={{ fontSize: ".7rem", color: "#a3e635", marginBottom: 3, fontWeight: 600 }}>{m.from_name || m.from_email}</div>}
                    <div>{m.body}</div>
                    <div style={{ fontSize: ".65rem", opacity: 0.6, marginTop: 4 }}>
                      {new Date(m.created_at).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", gap: 10 }}>
              <input
                className="search"
                style={{ flex: 1, minWidth: 0 }}
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button className="btn btn-lime" onClick={send}>Send</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <EmptyMessages />
          </div>
        )}
      </div>

      {showNewThread && (
        <div className="modal-overlay" onClick={() => setShowNewThread(false)}>
          <div className="modal-card" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div><h3>New Thread</h3><p>Choose a project or client</p></div>
              <button className="modal-close" onClick={() => setShowNewThread(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Thread key</label>
                <input
                  className="form-input"
                  placeholder="e.g., project:Greenhouse-Nakuru or client:mary@x.com"
                  value={newThreadKey}
                  onChange={(e) => setNewThreadKey(e.target.value)}
                />
                <div className="form-help">Prefix with "project:" or "client:" — auto-added if omitted.</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", color: "#111", borderColor: "#ddd" }} onClick={() => setShowNewThread(false)}>Cancel</button>
              <button className="btn btn-lime" style={{ flex: 1, justifyContent: "center" }} onClick={createThread}>Open Thread</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}