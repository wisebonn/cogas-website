"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useScrolled, useToast } from "@/lib/hooks";
import { Toast } from "@/components/Toast";
import { IMG } from "@/lib/images";

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
      showToast("Thank you! We'll be in touch within one business day.");
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
              A consultant — an actual family member, not a bot — replies within
              one business day.
            </p>
          </div>
        </div>
      </header>

      <section>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 44,
              alignItems: "start",
            }}
          >
            <div>
              <span className="eyebrow">Why talk to us</span>
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
                    <b>Free discovery call</b>
                    <span>30 minutes, no obligation.</span>
                  </div>
                </div>
                <div className="feat">
                  <span className="dot">02</span>
                  <div>
                    <b>Fixed-scope quote</b>
                    <span>Clear deliverables, clear price, in writing.</span>
                  </div>
                </div>
                <div className="feat">
                  <span className="dot">03</span>
                  <div>
                    <b>Real-time tracking</b>
                    <span>Your own portal from day one.</span>
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
                We never share your details. Reply within one business day.
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

      <Toast message={toastMsg} />
    </>
  );
}