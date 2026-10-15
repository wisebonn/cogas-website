"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { HexGrid } from "@/components/HexGrid";
import { Toast } from "@/components/Toast";
import { useScrolled, useReveal, useToast } from "@/lib/hooks";
import { IMG } from "@/lib/images";

interface Review {
  t: string;
  a: string;
  m: string;
}

const REVIEWS: Review[] = [
  {
    t: '"The feasibility study convinced our bank in one meeting. The portal meant we never once wondered what was happening."',
    a: "Mary K. — Dairy Cooperative Chairperson",
    m: "Dairy Market Entry · 2026",
  },
  {
    t: '"Their risk model showed us exactly which acreage we could insure profitably. Actuarial science applied to farming — brilliant."',
    a: "Joseph O. — Commercial Farm Manager",
    m: "Risk & Financial Modeling · 2026",
  },
  {
    t: '"Post-harvest losses dropped from 30% to 9% after their cold-chain redesign. The ROI was visible within one season."',
    a: "Amina S. — Mango Exporter",
    m: "Supply Chain Design · 2025",
  },
  {
    t: '"AgriMind answered in seconds what used to take me weeks of literature review. We now subscribe for our whole agronomy team."',
    a: "Dr. Peter N. — Agri Researcher",
    m: "AgriMind AI · 2026",
  },
];

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
];

const FALLBACK =
  '<b>AgriMind:</b> Good question — the full knowledge base holds 25+ years of research across crops, methods and markets. In the live product I\'d retrieve the exact studies, datasets and citations. Try asking about <i>greenhouse tomatoes</i>, <i>maize trials</i> or <i>post-harvest losses</i>.';

export default function HomePage() {
  const navScrolled = useScrolled(40);
  const { toastMsg, showToast } = useToast(3200);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [activePane, setActivePane] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatBody, setChatBody] = useState<{ text: string; cls: string }[]>([
    {
      text: '<b>AgriMind:</b> Karibu! Ask me anything about agribusiness — try a crop, a method, or a market question.',
      cls: "msg bot",
    },
  ]);
  const chatRef = useRef<HTMLDivElement>(null);

  useReveal();

  // Reviews carousel timer
  useEffect(() => {
    const timer = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % REVIEWS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatBody]);

  const botReply = (q: string) => {
    const s = q.toLowerCase();
    for (const item of KB) if (item.k.some((k) => s.includes(k))) return item.a;
    return FALLBACK;
  };

  const ask = (msg?: string) => {
    const q = msg || chatInput;
    if (!q.trim()) return;
    setChatBody((prev) => [
      ...prev,
      { text: q.replace(/</g, "&lt;"), cls: "msg user" },
    ]);
    if (!msg) setChatInput("");
    setTimeout(() => {
      setChatBody((prev) => [...prev, { text: botReply(q), cls: "msg bot" }]);
    }, 650);
  };

  const revMove = (d: number) => {
    setReviewIndex((prev) => (prev + d + REVIEWS.length) % REVIEWS.length);
  };

  return (
    <>
      <nav className={`nav ${navScrolled ? "scrolled" : ""}`}>
        <div className="container nav-inner">
          <a className="logo" href="#">
            <span className="logo-mark">CO</span>COGAs
            <span style={{ fontWeight: 400, opacity: 0.6, fontSize: ".85rem" }}>
              &nbsp;Consultancy
            </span>
          </a>
          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#product">AgriMind AI</a>
            <Link href="/products">Products</Link>
            <a href="#portal">Client Portal</a>
            <Link href="/team">Team Portal</Link>
          </div>
          <a className="btn btn-lime" href="#contact">
            Start a Project
          </a>
        </div>
      </nav>

      <Hero
        eyebrow="Family-run · Science-led · Africa-focused"
        title={
          <>
            Grow your agribusiness with <em>five disciplines</em>, one family, one
            goal.
          </>
        }
        subtitle="COGAs Consultancy blends decades of agro-economic research with actuarial rigor, digital marketing, engineering and supply-chain mastery — delivered through a modern client portal where you track every milestone in real time."
        primaryCta={{ label: "Book a Consultation →", href: "#contact" }}
        secondaryCta={{ label: "Team Portal", href: "/team" }}
        stats={[
          { value: 25, suffix: "+", label: "Years of agro-economic research" },
          { value: 120, suffix: "+", label: "Farm & agri-SME clients advised" },
          { value: 14, suffix: "", label: "Value-chain studies completed" },
        ]}
        backgroundImage={IMG.heroField}
      />

      {/* About / Family */}
      <section id="about">
        <div className="container">
          <span className="eyebrow">The Family Behind COGAs</span>
          <h2 className="section-title">One dinner table. Five areas of expertise.</h2>
          <p className="lead">
            COGAs was founded on our father's lifetime of agro-economic research —
            and built stronger by each sibling's specialisation, all serving a
            single goal: making agribusiness work.
          </p>

          <div className="family-grid">
            <div className="member reveal">
              <span className="founder-tag">FOUNDER</span>
              <div className="avatar">CO</div>
              <h3>Dad — Principal Consultant</h3>
              <div className="role">Agro-Economics</div>
              <p>
                Decades of field research, policy work and value-chain studies.
                The knowledge base behind AgriMind AI.
              </p>
            </div>

            <div className="member reveal">
              <div className="avatar">DM</div>
              <h3>Sibling — Growth Lead</h3>
              <div className="role">Digital Marketing · MSc</div>
              <p>
                Positions agri brands and farm products in digital markets with
                data-driven campaigns.
              </p>
            </div>

            <div className="member reveal">
              <div className="avatar">AS</div>
              <h3>Sibling — Risk & Finance</h3>
              <div className="role">Actuarial Science</div>
              <p>
                Models crop risk, pricing, insurance and investment scenarios so
                decisions are quantified.
              </p>
            </div>

            <div className="member reveal">
              <div className="avatar">EN</div>
              <h3>Sibling — Digital Solutions</h3>
              <div className="role">Engineering · Digital Build</div>
              <p>
                Builds the client portal, dashboards, automations and the tech
                stack you're using right now.
              </p>
            </div>

            <div className="member reveal">
              <div className="avatar">LG</div>
              <h3>Sibling — Operations</h3>
              <div className="role">Logistics & Supply Chain · MSc</div>
              <p>
                Designs cold-chain, distribution and post-harvest systems that cut
                losses and cost.
              </p>
            </div>
          </div>

          <HexGrid />
        </div>
      </section>

      {/* Services */}
      <section className="services" id="services">
        <div className="container">
          <span className="eyebrow">What We Do</span>
          <h2 className="section-title">Consultancy services across the whole value chain</h2>

          <div className="svc-grid">
            <div className="svc reveal">
              <div className="icon">🌾</div>
              <h3>Feasibility Studies</h3>
              <p>Bankable feasibility for farms, greenhouses, agro-processing and exports.</p>
              <span className="tag">Agro-Economics</span>
            </div>

            <div className="svc reveal">
              <div className="icon">📊</div>
              <h3>Agricultural Research</h3>
              <p>Designed methodologies, trials and field studies — what worked, what didn't, why.</p>
              <span className="tag">Research Desk</span>
            </div>

            <div className="svc reveal">
              <div className="icon">🎯</div>
              <h3>Market Entry & Branding</h3>
              <p>Go-to-market strategy and digital campaigns for agri products and cooperatives.</p>
              <span className="tag">Digital Marketing</span>
            </div>

            <div className="svc reveal">
              <div className="icon">🛡️</div>
              <h3>Risk & Financial Modeling</h3>
              <p>Crop insurance structures, pricing models, credit scoring and investment analysis.</p>
              <span className="tag">Actuarial</span>
            </div>

            <div className="svc reveal">
              <div className="icon">🚛</div>
              <h3>Supply Chain Design</h3>
              <p>Cold chain, warehousing, distribution routes and post-harvest loss reduction.</p>
              <span className="tag">Logistics</span>
            </div>

            <div className="svc reveal">
              <div className="icon">💻</div>
              <h3>Digital Solutions</h3>
              <p>Client portals, farm-management dashboards, automation and data pipelines.</p>
              <span className="tag">Engineering</span>
            </div>

            <div className="svc reveal">
              <div className="icon">📋</div>
              <h3>Project Management</h3>
              <p>End-to-end execution with transparent milestones in your client portal.</p>
              <span className="tag">All Departments</span>
            </div>

            <div className="svc reveal">
              <div className="icon">📈</div>
              <h3>AgriMind AI Access</h3>
              <p>Subscription access to our AI knowledge engine built on 25+ years of research.</p>
              <span className="tag">Product</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product — AgriMind */}
      <section className="product" id="product">
        <div className="container">
          <div className="product-grid">
            <div>
              <span className="eyebrow" style={{ color: "var(--lime)" }}>
                Flagship Digital Product
              </span>
              <h2 className="section-title" style={{ color: "#fff" }}>
                AgriMind — the AI dictionary for professional agribusiness
              </h2>
              <p className="lead">
                Our father's entire research archive — every study, methodology,
                dataset and field note — structured, enriched with real-world data,
                and queryable in seconds.
              </p>

              <div className="feat-list">
                <div className="feat reveal">
                  <span className="dot">01</span>
                  <div>
                    <b>Research-grade answers</b>
                    <span>Ask about any crop, region or method and get cited, field-tested guidance.</span>
                  </div>
                </div>

                <div className="feat reveal">
                  <span className="dot">02</span>
                  <div>
                    <b>Methodology library</b>
                    <span>Step-by-step research designs that worked — trials, surveys, sampling frames.</span>
                  </div>
                </div>

                <div className="feat reveal">
                  <span className="dot">03</span>
                  <div>
                    <b>Living knowledge base</b>
                    <span>Continuously improved with real project outcomes from our consultancy work.</span>
                  </div>
                </div>

                <div className="feat reveal">
                  <span className="dot">04</span>
                  <div>
                    <b>Web today, app stores next</b>
                    <span>Ships on this platform now; iOS & Android versions on the roadmap.</span>
                  </div>
                </div>
              </div>

              <a className="btn btn-lime" style={{ marginTop: 32 }} href="#contact">
                Join the Waitlist
              </a>
            </div>

            <div className="chat reveal">
              <div className="chat-head">
                <span className="live"></span> AgriMind AI · Interactive Preview
              </div>

              <div className="chat-body" ref={chatRef}>
                {chatBody.map((msg, i) => (
                  <div
                    key={i}
                    className={msg.cls}
                    dangerouslySetInnerHTML={{ __html: msg.text }}
                  />
                ))}
              </div>

              <div className="chips">
                <span className="chip" onClick={() => ask("Is greenhouse tomato farming profitable in Nakuru?")}>
                  Is greenhouse tomato farming profitable in Nakuru?
                </span>
                <span className="chip" onClick={() => ask("How do I design a maize yield trial?")}>
                  How do I design a maize yield trial?
                </span>
                <span className="chip" onClick={() => ask("Reduce post-harvest losses in mangoes")}>
                  Reduce post-harvest losses in mangoes
                </span>
              </div>

              <div className="chat-input">
                <input
                  placeholder="Ask AgriMind..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask()}
                />
                <button onClick={() => ask()}>Ask</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Preview */}
      <section id="portal">
        <div className="container">
          <span className="eyebrow">For Clients</span>
          <h2 className="section-title">Your project, visible in real time</h2>
          <p className="lead">
            Every COGAs client gets portal access: start projects, make payments,
            monitor progress, review deliverables and collaborate with the team —
            all in one place.
          </p>

          <div className="portal-tabs">
            {["Active Projects", "Milestones", "Collaboration"].map((tab, i) => (
              <button
                key={i}
                className={`ptab ${activePane === i ? "active" : ""}`}
                onClick={() => setActivePane(i)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activePane === 0 && (
            <div className="pane active">
              <div className="proj-grid">
                <div className="proj">
                  <span className="pill pill-green">On track</span>
                  <h4>Greenhouse Feasibility — Nakuru</h4>
                  <div className="meta">Agro-Economics · started 12 Aug 2026</div>
                  <div className="bar">
                    <i style={{ width: "68%" }}></i>
                  </div>
                  <div className="meta" style={{ textAlign: "right" }}>
                    68%
                  </div>
                </div>

                <div className="proj">
                  <span className="pill pill-gold">In review</span>
                  <h4>Maize Value-Chain Study</h4>
                  <div className="meta">Research Desk · started 03 Jul 2026</div>
                  <div className="bar">
                    <i style={{ width: "82%" }}></i>
                  </div>
                  <div className="meta" style={{ textAlign: "right" }}>
                    82%
                  </div>
                </div>

                <div className="proj">
                  <span className="pill pill-green">On track</span>
                  <h4>Dairy Market Entry Strategy</h4>
                  <div className="meta">Digital Marketing · started 21 Sep 2026</div>
                  <div className="bar">
                    <i style={{ width: "41%" }}></i>
                  </div>
                  <div className="meta" style={{ textAlign: "right" }}>
                    41%
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePane === 1 && (
            <div className="pane active">
              <div className="timeline">
                <div className="tl-item done">
                  <span className="tl-dot">✓</span>
                  <div>
                    <h4>Project kickoff & scope</h4>
                    <p>Completed 14 Aug · scope, budget and success metrics signed off.</p>
                  </div>
                </div>
                <div className="tl-item done">
                  <span className="tl-dot">✓</span>
                  <div>
                    <h4>Desk research & data collection</h4>
                    <p>Completed 05 Sep · 34 sources, 6 datasets ingested into AgriMind.</p>
                  </div>
                </div>
                <div className="tl-item">
                  <span className="tl-dot">3</span>
                  <div>
                    <h4>Field survey — Nakuru</h4>
                    <p>Scheduled Fri 09:00 · you'll receive GPS-tagged photos and notes live.</p>
                  </div>
                </div>
                <div className="tl-item">
                  <span className="tl-dot">4</span>
                  <div>
                    <h4>Financial model & risk analysis</h4>
                    <p>Actuarial desk · expected 30 Oct.</p>
                  </div>
                </div>
                <div className="tl-item">
                  <span className="tl-dot">5</span>
                  <div>
                    <h4>Final report & handover</h4>
                    <p>Board-ready deck + full dataset export.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePane === 2 && (
            <div className="pane active">
              <div className="collab">
                <div className="thread">
                  <div className="cmt">
                    <span className="avatar">CO</span>
                    <div>
                      <b>Principal Consultant</b>
                      <small>2h ago</small>
                      <p>
                        Field survey protocol is in your documents. Please approve by
                        Thursday so we book the enumerators.
                      </p>
                    </div>
                  </div>
                  <div className="cmt">
                    <span
                      className="avatar"
                      style={{ background: "linear-gradient(135deg,#93c5fd,#2563eb)" }}
                    >
                      CL
                    </span>
                    <div>
                      <b>You (Client)</b>
                      <small>1h ago</small>
                      <p>Approved. Also please add a water-source assessment to the survey.</p>
                    </div>
                  </div>
                  <div className="cmt">
                    <span
                      className="avatar"
                      style={{ background: "linear-gradient(135deg,#c4b5fd,#7c3aed)" }}
                    >
                      EN
                    </span>
                    <div>
                      <b>Digital Solutions</b>
                      <small>20m ago</small>
                      <p>
                        Done — added to the digital survey form. You'll see results
                        stream in real time on Friday.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="doc-list">
                  <div className="doc">
                    <span className="file">📄 Feasibility_Protocol_v2.pdf</span>
                    <small>2.1 MB</small>
                  </div>
                  <div className="doc">
                    <span className="file">📊 Survey_Dataset_W1.xlsx</span>
                    <small>840 KB</small>
                  </div>
                  <div className="doc">
                    <span className="file">🖼️ Field_Photos_Nakuru.zip</span>
                    <small>14 MB</small>
                  </div>
                  <div className="doc">
                    <span className="file">📈 Risk_Model_Draft.xlsx</span>
                    <small>1.2 MB</small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="reviews" id="reviews">
        <div className="container">
          <span className="eyebrow">Client Reviews</span>
          <h2 className="section-title">Trusted across the value chain</h2>

          <div className="rev-wrap">
            <div className="rev-card">
              <div className="stars">★★★★★</div>
              <blockquote>{REVIEWS[reviewIndex].t}</blockquote>
              <cite>
                {REVIEWS[reviewIndex].a}
                <span>{REVIEWS[reviewIndex].m}</span>
              </cite>
            </div>

            <div className="rev-nav">
              <button onClick={() => revMove(-1)}>←</button>
              <button onClick={() => revMove(1)}>→</button>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section>
        <div className="container">
          <span className="eyebrow">How It Works</span>
          <h2 className="section-title">From first call to final deliverable</h2>

          <div className="steps">
            <div className="step reveal">
              <h3>Consultation</h3>
              <p>Free discovery call. We scope the problem and match you to the right family expertise.</p>
            </div>
            <div className="step reveal">
              <h3>Proposal & Payment</h3>
              <p>Transparent quote, milestones and secure online payment — card or mobile money.</p>
            </div>
            <div className="step reveal">
              <h3>Executed in the Open</h3>
              <p>Your portal goes live: track tasks, chat with the team, review documents as they're produced.</p>
            </div>
            <div className="step reveal">
              <h3>Handover & Growth</h3>
              <p>Final deliverables plus optional AgriMind AI subscription to keep the knowledge working for you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <ContactForm showToast={showToast} />

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="foot-grid">
            <div>
              <a className="logo" href="#" style={{ marginBottom: 14 }}>
                <span className="logo-mark">CO</span>COGAs
              </a>
              <p style={{ maxWidth: 300 }}>
                A family consultancy turning agro-economic research into working
                agribusinesses — with actuarial rigor, digital reach, engineering
                and logistics behind every recommendation.
              </p>
            </div>

            <div>
              <h4>Consultancy</h4>
              <a href="#services">Services</a>
              <a href="#portal">Client Portal</a>
              <Link href="/products">Products</Link>
              <a href="#reviews">Reviews</a>
            </div>

            <div>
              <h4>Departments</h4>
              <a href="#about">Agro-Economics</a>
              <a href="#about">Actuarial & Risk</a>
              <a href="#about">Digital Marketing</a>
              <a href="#about">Logistics & Supply Chain</a>
            </div>

            <div>
              <h4>Company</h4>
              <a href="#about">Our Story</a>
              <Link href="/team">Team Portal</Link>
              <Link href="/client">Client Portal</Link>
              <a href="#contact">Contact</a>
            </div>
          </div>

          <div className="foot-bottom">
  <span>© 2026 COGAs Consultancy. A family business.</span>
  <span style={{ display: "flex", gap: 16 }}>
    <a href="https://wa.me/254722768745" target="_blank" rel="noopener noreferrer">
      💬 WhatsApp
    </a>
    <a href="mailto:bonventurep@gmail.com">✉️ Email</a>
  </span>
</div>
</div>
</footer>

<Toast message={toastMsg} />
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Contact form — writes to Supabase enquiries table
// ────────────────────────────────────────────────────────────
function ContactForm({ showToast }: { showToast: (m: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await import("@/lib/supabaseClient").then(({ supabase }) =>
        supabase.from("enquiries").insert({
          name,
          email,
          phone,
          service_interest: service,
          message,
          source: "website",
          stage: "new",
        })
      );
      if (error) throw error;
      showToast("Thank you! Your consultation request has been received.");
      setName("");
      setEmail("");
      setPhone("");
      setService("");
      setMessage("");
    } catch (err: any) {
      showToast("Couldn't send: " + (err?.message || "try again"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="cta" id="contact">
      <div className="container cta-grid">
        <div>
          <span className="eyebrow" style={{ color: "var(--lime)" }}>
            Start Today
          </span>
          <h2 className="section-title" style={{ color: "#fff" }}>
            Let's make your agribusiness work.
          </h2>
          <p style={{ color: "rgba(255,255,255,.75)", maxWidth: 460 }}>
            Tell us about your project. A consultant — an actual family member, not
            a bot — replies within one business day.
          </p>

          <div className="pay-badges">
            <span>💳 Visa / Mastercard</span>
            <span>📱 M-Pesa</span>
            <span>🏦 Bank Transfer</span>
            <span>🔒 SSL Secured</span>
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <input
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            required
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <select
            required
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">What do you need?</option>
            <option>Feasibility study</option>
            <option>Agricultural research</option>
            <option>Market entry & marketing</option>
            <option>Risk & financial modeling</option>
            <option>Supply chain design</option>
            <option>Digital solution build</option>
            <option>AgriMind AI subscription</option>
          </select>
          <textarea
            placeholder="Tell us briefly about your project..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className="btn btn-lime"
            style={{ justifyContent: "center" }}
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Request Consultation →"}
          </button>
        </form>
      </div>
    </section>
  );
}