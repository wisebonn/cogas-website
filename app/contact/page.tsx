"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useScrolled, useToast } from "@/lib/hooks";
import { Toast } from "@/components/Toast";
import { IMG } from "@/lib/images";
import { CONTACT, whatsappUrl, telUrl, mailtoUrl } from "@/lib/contact";

export default function ContactPage() {
  const navScrolled = useScrolled(40);
  const { toastMsg, showToast } = useToast(3500);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("enquiries").insert({
        name,
        email,
        phone,
        company,
        service_interest: service,
        message,
        source: "website",
        stage: "new",
      });
      if (error) throw error;

      showToast(
        "Thank you! Check your email — we've sent you a confirmation with next steps."
      );
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setService("");
      setMessage("");
    } catch (err: any) {
      showToast("Couldn't send: " + (err?.message || "try again"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <nav className={`nav ${navScrolled ? "scrolled" : ""}`}>
        <div className="container nav-inner">
          <Link className="logo" href="/">
            <span className="logo-mark">CO</span>COGAs
          </Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/products">Products</Link>
            <Link href="/about">About</Link>
            <Link href="/#services">Services</Link>
          </div>
          <Link className="btn btn-lime" href="/login">
            Sign In
          </Link>
        </div>
      </nav>

      <header
        className="hero-photo"
        style={{
          backgroundImage: `url(${IMG.heroField})`,
          minHeight: "50vh",
        }}
      >
        <div className="hero-inner" style={{ gridTemplateColumns: "1fr" }}>
          <div style={{ maxWidth: 720 }}>
            <span className="eyebrow" style={{ color: "var(--lime)" }}>
              Get in touch
            </span>
            <h1 style={{ marginTop: 20 }}>Tell us about your project.</h1>
            <p className="lead-hero">
              Pick the channel that suits you — call, WhatsApp, email, or fill the
              form below. A consultant replies within one business day.
            </p>
          </div>
        </div>
      </header>

      <section>
        <div className="container">
          {/* Quick contact channels */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              marginBottom: 48,
            }}
          >
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "20px 22px",
                background: "#fff",
                border: "1.5px solid var(--line)",
                borderRadius: 14,
                transition: "all .2s",
                textDecoration: "none",
                color: "inherit",
              }}
              className="contact-channel"
            >
              <span style={{ fontSize: "1.8rem" }}>💬</span>
              <div>
                <b
                  style={{
                    display: "block",
                    fontSize: ".92rem",
                    color: "var(--ink)",
                    marginBottom: 2,
                  }}
                >
                  WhatsApp
                </b>
                <small style={{ color: "var(--muted)", fontSize: ".8rem" }}>
                  {CONTACT.primaryPhoneDisplay}
                </small>
              </div>
            </a>

            <a
              href={telUrl()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "20px 22px",
                background: "#fff",
                border: "1.5px solid var(--line)",
                borderRadius: 14,
                transition: "all .2s",
                textDecoration: "none",
                color: "inherit",
              }}
              className="contact-channel"
            >
              <span style={{ fontSize: "1.8rem" }}>📞</span>
              <div>
                <b
                  style={{
                    display: "block",
                    fontSize: ".92rem",
                    color: "var(--ink)",
                    marginBottom: 2,
                  }}
                >
                  Call us
                </b>
                <small style={{ color: "var(--muted)", fontSize: ".8rem" }}>
                  {CONTACT.primaryPhoneDisplay}
                </small>
              </div>
            </a>

            <a
              href={mailtoUrl()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "20px 22px",
                background: "#fff",
                border: "1.5px solid var(--line)",
                borderRadius: 14,
                transition: "all .2s",
                textDecoration: "none",
                color: "inherit",
              }}
              className="contact-channel"
            >
              <span style={{ fontSize: "1.8rem" }}>✉️</span>
              <div>
                <b
                  style={{
                    display: "block",
                    fontSize: ".92rem",
                    color: "var(--ink)",
                    marginBottom: 2,
                  }}
                >
                  Email
                </b>
                <small style={{ color: "var(--muted)", fontSize: ".8rem" }}>
                  {CONTACT.primaryEmail}
                </small>
              </div>
            </a>
          </div>

          {/* Form + info */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 44,
              alignItems: "start",
            }}
            className="contact-grid"
          >
            <div>
              <span className="eyebrow">Or send a written enquiry</span>
              <h2 className="section-title">A conversation beats a form.</h2>
              <p className="lead">
                Every project starts with a free discovery call. We scope the
                problem, identify which of our five disciplines fits best, and give
                you a transparent view of what it will cost and take.
              </p>

              <div className="feat-list" style={{ marginTop: 36 }}>
                <div className="feat">
                  <span className="dot">01</span>
                  <div>
                    <b>You submit an enquiry</b>
                    <span>
                      Fill the form or reach us directly via WhatsApp, call, or
                      email.
                    </span>
                  </div>
                </div>
                <div className="feat">
                  <span className="dot">02</span>
                  <div>
                    <b>We confirm within minutes</b>
                    <span>
                      You'll receive an automatic email confirming we got it —
                      plus what happens next.
                    </span>
                  </div>
                </div>
                <div className="feat">
                  <span className="dot">03</span>
                  <div>
                    <b>A consultant reaches out</b>
                    <span>Within one business day, by call or email — your choice.</span>
                  </div>
                </div>
                <div className="feat">
                  <span className="dot">04</span>
                  <div>
                    <b>Fixed-scope proposal</b>
                    <span>
                      Clear deliverables, clear price, in writing. Trackable in
                      your own portal.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pay-badges" style={{ marginTop: 32 }}>
                <span>💳 Visa / Mastercard</span>
                <span>📱 M-Pesa</span>
                <span>🏦 Bank Transfer</span>
                <span>🔒 SSL Secured</span>
              </div>
            </div>

            <form className="form-light" onSubmit={handleSubmit}>
              <div>
                <label className="form-label">Full name *</label>
                <input
                  required
                  placeholder="e.g., Mary Kamau"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Email *</label>
                <input
                  required
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    placeholder="+254..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Company</label>
                  <input
                    placeholder="Optional"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">What do you need? *</label>
                <select
                  required
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option value="">Select a service</option>
                  <option>Feasibility study</option>
                  <option>Agricultural research</option>
                  <option>Market entry & marketing</option>
                  <option>Risk & financial modeling</option>
                  <option>Supply chain design</option>
                  <option>Digital solution build</option>
                  <option>AgriMind AI subscription</option>
                  <option>Not sure yet — advise me</option>
                </select>
              </div>

              <div>
                <label className="form-label">Tell us about your project *</label>
                <textarea
                  required
                  placeholder="Crop, region, scale, what you're hoping to achieve..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-lime btn-block"
                style={{ justifyContent: "center", marginTop: 8 }}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send enquiry →"}
              </button>

              <p
                style={{
                  fontSize: ".72rem",
                  color: "var(--muted)",
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                You'll get a confirmation email immediately. Reply within one
                business day.
              </p>
            </form>
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

      <style jsx>{`
        :global(.contact-channel:hover) {
          border-color: #a3e635 !important;
          transform: translateY(-3px);
          box-shadow: 0 20px 50px -20px rgba(4, 23, 14, 0.25);
        }
        @media (max-width: 900px) {
          :global(.contact-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <Toast message={toastMsg} />
    </>
  );
}