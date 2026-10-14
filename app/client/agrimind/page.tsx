"use client";

import { useState, useRef, useEffect } from "react";
import { IMG } from "@/lib/images";

const KB = [
  { k: ["greenhouse", "tomato", "nakuru", "profit"],
    a: "<b>AgriMind:</b> Based on 3 greenhouse studies in the Rift Valley (2018–2025): a 500m² unit with drip irrigation shows breakeven in <b>14–18 months</b> at farm-gate KSh 60–80/kg." },
  { k: ["maize", "trial", "yield"],
    a: "<b>AgriMind:</b> Recommended maize yield-trial design: <b>RCBD with 4 replications</b>, plot size 5m × 4m, border rows to limit edge effects." },
  { k: ["mango", "post-harvest", "cold"],
    a: "<b>AgriMind:</b> Hygiene harvesting + 3-hour pre-cooling to 13°C cuts mango post-harvest losses from 25–40% to under 10%." },
  { k: ["irrigation", "drip", "water"],
    a: "<b>AgriMind:</b> Drip irrigation costs KSh 180,000–250,000/acre but cuts water usage 40–60% and increases yields 20–35%. Payback typically 2–3 seasons for high-value crops." },
];

const FALLBACK = '<b>AgriMind:</b> Good question. In the live product I\'d retrieve cited answers from the full knowledge base. Try asking about <i>greenhouse tomatoes</i>, <i>maize trials</i>, <i>mango post-harvest</i>, or <i>drip irrigation</i>.';

export default function ClientAgriMindPage() {
  const [messages, setMessages] = useState([{ text: "<b>AgriMind:</b> Hi! Your subscription gives you full access to my knowledge base. Ask me anything.", cls: "msg bot" }]);
  const [input, setInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [messages]);

  const ask = (msg?: string) => {
    const q = msg || input;
    if (!q.trim()) return;
    setMessages((prev) => [...prev, { text: q, cls: "msg user" }]);
    if (!msg) setInput("");
    setTimeout(() => {
      const s = q.toLowerCase();
      const hit = KB.find((item) => item.k.some((k) => s.includes(k)));
      setMessages((prev) => [...prev, { text: hit ? hit.a : FALLBACK, cls: "msg bot" }]);
    }, 600);
  };

  return (
    <div>
      <div className="module-hero" style={{ backgroundImage: `url(${IMG.greenhouse})`, minHeight: 160 }}>
        <div>
          <h2>🌿 AgriMind AI</h2>
          <p>Your personal agribusiness research assistant</p>
        </div>
      </div>

      <div className="chat" style={{ marginTop: 20, background: "#0b1f15" }}>
        <div className="chat-head">
          <span className="live"></span> AgriMind AI · Subscriber access
        </div>
        <div className="chat-body" ref={ref}>
          {messages.map((m, i) => (
            <div key={i} className={m.cls} dangerouslySetInnerHTML={{ __html: m.text }} />
          ))}
        </div>
        <div className="chips">
          {["Greenhouse tomato profitability", "Maize trial design", "Mango post-harvest", "Drip irrigation"].map((s) => (
            <span key={s} className="chip" onClick={() => ask(s)}>{s}</span>
          ))}
        </div>
        <div className="chat-input">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask AgriMind..." />
          <button onClick={() => ask()}>Ask</button>
        </div>
      </div>
    </div>
  );
}