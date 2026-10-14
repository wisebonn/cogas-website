"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { IMG } from "@/lib/images";
import { useScrolled, useReveal, useToast } from "@/lib/hooks";
import { Toast } from "@/components/Toast";

interface Message {
  text: string;
  cls: string;
}

const KB = [
  {
    k: ["greenhouse", "tomato", "nakuru", "profit"],
    a: '<b>AgriMind:</b> Based on 3 greenhouse studies in the Rift Valley (2018–2025): a 500m² unit with drip irrigation shows breakeven in <b>14–18 months</b> at farm-gate KSh 60–80/kg. Key risks: powdery mildew in cold months and input price volatility. Want the full cited feasibility framework?',
  },
  {
    k: ["maize", "trial", "yield", "design", "research", "methodolog"],
    a: "<b>AgriMind:</b> Our recommended maize yield-trial design: <b>RCBD with 4 replications</b>, plot size 5m × 4m, border rows to limit edge effects. From the 2019 trial series: this design detected a 12% treatment effect at p&lt;0.05 with n=48 plots. Full protocol with sampling frames is in the methodology library.",
  },
  {
    k: ["mango", "post-harvest", "loss", "cold", "storage"],
    a: "<b>AgriMind:</b> Mango post-harvest losses of 25–40% are typical without cold chain. Evidence from 2 coastal studies: <b>hygiene harvesting + 3-hour pre-cooling to 13°C</b> cuts losses to under 10%. I can draft a costed cold-chain layout for your volume — say the word.",
  },
  {
    k: ["feasibility", "bank", "loan", "finance", "invest"],
    a: "<b>AgriMind:</b> A bankable agri feasibility needs 5 components: market analysis, technical plan, financial model (10-yr DCF), risk register, and management profile. COGAs' actuarial desk adds scenario and insurance analysis — the section banks respond to most. Start a project from this page to get one.",
  },
  {
    k: ["dairy", "milk", "cow"],
    a: "<b>AgriMind:</b> For a 20-cow dairy unit in Kenya, expected daily yield of 200–280L at peak. Key metrics: feed conversion ratio under 1.5, cost per litre under KSh 28 for profitability at processor prices of KSh 40–50/L. Cold chain is essential — bulk tank or cooling cans for smaller volumes.",
  },
  {
    k: ["poultry", "chicken", "eggs"],
    a: "<b>AgriMind:</b> Layer operation profitability hinges on feed cost (60–70% of total). At KSh 420/50kg feed and 85% lay rate, breakeven egg price is roughly KSh 11–13/egg. Scale matters — under 500 birds, you're subsidising your own time.",
  },
  {
    k: ["irrigation", "drip", "water"],
    a: "<b>AgriMind:</b> Drip irrigation costs KSh 180,000–250,000 per acre to install but cuts water usage 40–60% vs furrow, and increases yields 20–35%. Payback typically 2–3 seasons for high-value crops (tomato, capsicum, strawberry). Requires reliable water source — borehole or dam recommended.",
  },
  {
    k: ["loan", "credit", "agrifinance"],
    a: "<b>AgriMind:</b> Kenyan agri-lenders evaluate: (1) production history, (2) off-take contracts, (3) insurance coverage, (4) collateral (land title or chattel), (5) cashflow projections. Our feasibility studies are designed to answer all 5 in a bank-recognised format.",
  },
];

const FALLBACK =
  '<b>AgriMind:</b> Good question — the full knowledge base holds 25+ years of research across crops, methods and markets. In the live product I\'d retrieve the exact studies, datasets and citations. Try asking about <i>greenhouse tomatoes</i>, <i>maize trials</i>, <i>post-harvest losses</i>, <i>dairy</i>, or <i>irrigation</i>.';

const SUGGESTIONS = [
  "Is greenhouse tomato farming profitable in Nakuru?",
  "How do I design a maize yield trial?",
  "Reduce post-harvest losses in mangoes",
  "What makes a bankable agri feasibility?",
  "Dairy unit economics in Kenya",
  "Is drip irrigation worth the cost?",
];

export default function AgriMindPublicPage() {
  const navScrolled = useScrolled(40);
  const { toastMsg, showToast } = useToast(3200);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "<b>AgriMind:</b> Karibu! I'm the AI knowledge engine behind COGAs Consultancy — trained on 25+ years of agro-economic research. Ask me anything about crops, methods, markets or finance.",
      cls: "msg bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useReveal();

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  const botReply = (q: string) => {
    const s = q.toLowerCase();
    for (const item of KB) if (item.k.some((k) => s.includes(k))) return item.a;
    return FALLBACK;
  };

  const ask = (msg?: string) => {
    const q = msg || input;
    if (!q.trim() || thinking) return;

    setMessages((prev) => [
      ...prev,
      { text: q.replace(/</g, "&lt;"), cls: "msg user" },
    ]);
    if (!msg) setInput("");
    setThinking(true);

    setTimeout(() => {
      setMessages((prev) => [...prev, { text: botReply(q), cls: "msg bot" }]);
      setThinking(false);
    }, 700);
  };

  return (
    <>
      <nav className={`nav ${navScrolled ? "scrolled" : ""}`}>
        <div className="container nav-inner">
          <Link className="logo" href="/">
            <span className="logo-mark">CO</span>COGAs
            <span style={{ fontWeight: 400, opacity: 0.6, fontSize: ".85rem" }}>
              &nbsp;AgriMind
            </span>
          </Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/products">Products</Link>
            <Link href="/#contact">Contact</Link>
          </div>
          <Link className="btn btn-lime" href="/#contact">
            Subscribe
          </Link>
        </div>
      </nav>

      <header
        className="hero-photo"
        style={{
          backgroundImage: `url(${IMG.greenhouse})`,
          minHeight: "58vh",
        }}
      >
        <div className="hero-inner" style={{ gridTemplateColumns: "1fr" }}>
          <div style={{ maxWidth: 780 }}>
            <span className="eyebrow" style={{ color: "var(--lime)" }}>
              AgriMind AI
            </span>
            <h1 style={{ marginTop: 20 }}>
              The AI dictionary for <em>professional agribusiness</em>.
            </h1>
            <p className="lead-hero">
              Our father's entire research archive — every study, methodology,
              dataset and field note — structured, enriched with real-world data,
              and queryable in seconds.
            </p>
          </div>
        </div>
      </header>

      <section>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.4fr",
              gap: 44,
              alignItems: "start",
            }}
          >
            <div>
              <span className="eyebrow">How it works</span>
              <h2 className="section-title">Cited answers, not guesses.</h2>
              <p className="lead" style={{ marginBottom: 28 }}>
                AgriMind retrieves the exact study, dataset, or field note that
                answers your question — and cites it. No hallucination. No
                generic advice.
              </p>

              <div className="feat-list">
                <div className="feat">
                  <span className="dot">01</span>
                  <div>
                    <b>Research-grade answers</b>
                    <span>
                      Ask about any crop, region or method and get field-tested
                      guidance.
                    </span>
                  </div>
                </div>
                <div className="feat">
                  <span className="dot">02</span>
                  <div>
                    <b>Methodology library</b>
                    <span>
                      Step-by-step research designs that worked — trials, surveys,
                      sampling frames.
                    </span>
                  </div>
                </div>
                <div className="feat">
                  <span className="dot">03</span>
                  <div>
                    <b>Living knowledge base</b>
                    <span>
                      Continuously improved with real project outcomes from our
                      consultancy work.
                    </span>
                  </div>
                </div>
                <div className="feat">
                  <span className="dot">04</span>
                  <div>
                    <b>Team seats</b>
                    <span>
                      One subscription covers your whole agronomy or management
                      team.
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 32,
                  padding: "18px 20px",
                  background: "rgba(163,230,53,.08)",
                  border: "1px solid rgba(163,230,53,.25)",
                  borderRadius: 14,
                }}
              >
                <b style={{ color: "var(--green-700)", display: "block", marginBottom: 6 }}>
                  KSh 15,000 / month
                </b>
                <small style={{ color: "var(--muted)", fontSize: ".82rem" }}>
                  Or $115 USD. Cancel anytime. Team seats included.
                </small>
                <Link
                  className="btn btn-lime btn-block"
                  style={{ marginTop: 16 }}
                  href="/#contact"
                >
                  Start subscription →
                </Link>
              </div>
            </div>

            <div className="chat reveal" style={{ background: "#0b1f15" }}>
              <div className="chat-head">
                <span className="live"></span> AgriMind AI · Live demo
              </div>

              <div className="chat-body" ref={chatRef}>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={msg.cls}
                    dangerouslySetInnerHTML={{ __html: msg.text }}
                  />
                ))}
                {thinking && (
                  <div className="msg bot" style={{ opacity: 0.6 }}>
                    <b>AgriMind:</b> thinking...
                  </div>
                )}
              </div>

              <div className="chips">
                {SUGGESTIONS.slice(0, 3).map((s) => (
                  <span key={s} className="chip" onClick={() => ask(s)}>
                    {s}
                  </span>
                ))}
              </div>

              <div className="chat-input">
                <input
                  placeholder="Ask AgriMind..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask()}
                  disabled={thinking}
                />
                <button onClick={() => ask()} disabled={thinking}>
                  Ask
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="services">
        <div className="container">
          <span className="eyebrow">Suggested questions</span>
          <h2 className="section-title">Try asking</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
              marginTop: 28,
            }}
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  ask(s);
                  window.scrollTo({ top: 400, behavior: "smooth" });
                }}
                style={{
                  textAlign: "left",
                  padding: "18px 20px",
                  background: "#fff",
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  cursor: "pointer",
                  fontSize: ".88rem",
                  color: "var(--ink)",
                  fontFamily: "inherit",
                  transition: "all .2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--agri-leaf)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span style={{ color: "var(--green-600)", fontWeight: 700, marginRight: 8 }}>
                  →
                </span>
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="foot-bottom" style={{ borderTop: "none", paddingTop: 0 }}>
            <span>© 2026 COGAs Consultancy. A family business.</span>
            <Link href="/">← Back to home</Link>
          </div>
        </div>
      </footer>

      <Toast message={toastMsg} />
    </>
  );
}