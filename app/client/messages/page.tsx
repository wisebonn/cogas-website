"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useProfile, useToast } from "@/lib/hooks";
import { Toast } from "@/components/Toast";

export default function ClientMessagesPage() {
  const { userEmail } = useProfile();
  const { toastMsg, showToast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [threadKey, setThreadKey] = useState("");
  const [loading, setLoading] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userEmail) return;
    const load = async () => {
      // client's thread is "client:<email>"
      const key = `client:${userEmail}`;
      setThreadKey(key);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_key", key)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      setLoading(false);
    };
    load();
  }, [userEmail]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !threadKey) return;
    await supabase.from("messages").insert({
      thread_key: threadKey,
      from_email: userEmail,
      from_name: userEmail,
      to_email: "team",
      body: input,
    });
    setInput("");
    const { data } = await supabase.from("messages").select("*").eq("thread_key", threadKey).order("created_at");
    setMessages(data || []);
    showToast("Sent ✓");
  };

  if (loading) return null;

  return (
    <div className="panel" style={{ marginTop: 0, display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <b style={{ color: "#fff" }}>💬 Chat with your team</b>
      </div>

      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && (
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".85rem", textAlign: "center", marginTop: 40 }}>
            No messages yet. Start the conversation.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.from_email === userEmail;
          return (
            <div key={m.id} style={{
              alignSelf: mine ? "flex-end" : "flex-start",
              maxWidth: "70%",
              padding: "10px 14px",
              borderRadius: 12,
              background: mine ? "#166534" : "rgba(255,255,255,.06)",
              color: "#fff",
              fontSize: ".86rem",
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

      <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", gap: 10 }}>
        <input
          className="search"
          style={{ flex: 1, minWidth: 0 }}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn btn-lime" onClick={send}>Send</button>
      </div>

      <Toast message={toastMsg} />
    </div>
  );
}