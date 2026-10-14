"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useScrolled, useReveal, useToast } from "@/lib/hooks";
import { Toast } from "@/components/Toast";
import { IMG } from "@/lib/images";

interface Product {
  id: string;
  icon: string;
  image: string;
  title: string;
  desc: string;
  priceKES: string;
  priceUSD: string;
  duration: string;
  dept: string;
  features: string[];
}

const PRODUCTS: Product[] = [
  {
    id: "feasibility",
    icon: "🌾",
    image: IMG.heroField,
    title: "Bankable Feasibility Studies",
    desc: "Investment-grade feasibility for farms, greenhouses, agro-processing and export ventures. Includes market analysis, technical plan, 10-year DCF, risk register and management profile.",
    priceKES: "From KSh 180,000",
    priceUSD: "From $1,400",
    duration: "4–8 weeks",
    dept: "Agro-Economics",
    features: [
      "Market & competitor analysis",
      "Technical feasibility",
      "10-year financial model (DCF)",
      "Risk register & mitigation",
      "Bank-ready documentation",
    ],
  },
  {
    id: "research",
    icon: "📊",
    image: IMG.hexWheat,
    title: "Agricultural Research & Trials",
    desc: "Designed methodologies, field trials and value-chain studies. We answer what worked, what didn't, and why — with statistically sound designs.",
    priceKES: "From KSh 120,000",
    priceUSD: "From $950",
    duration: "3–12 weeks",
    dept: "Research Desk",
    features: [
      "RCBD & split-plot designs",
      "Sampling frames & protocols",
      "Data collection & analysis",
      "Statistically validated results",
      "Full methodology library",
    ],
  },
  {
    id: "market",
    icon: "🎯",
    image: IMG.valueChain,
    title: "Market Entry & Branding",
    desc: "Go-to-market strategy and digital campaigns for agri products, cooperatives and agri-SMEs. We position your brand where buyers are looking.",
    priceKES: "From KSh 150,000",
    priceUSD: "From $1,150",
    duration: "4–6 weeks",
    dept: "Digital Marketing",
    features: [
      "Market entry strategy",
      "Brand identity & positioning",
      "Digital campaign setup",
      "Cooperative go-to-market",
      "Performance tracking",
    ],
  },
  {
    id: "risk",
    icon: "🛡️",
    image: IMG.sproutCoins,
    title: "Risk & Financial Modeling",
    desc: "Actuarial-grade crop risk models, insurance structures, pricing models and credit scoring for agri-lenders and investors.",
    priceKES: "From KSh 200,000",
    priceUSD: "From $1,550",
    duration: "4–8 weeks",
    dept: "Actuarial",
    features: [
      "Crop risk modeling",
      "Insurance structure design",
      "Pricing & credit scoring",
      "Investment scenario analysis",
      "Sensitivity & stress testing",
    ],
  },
  {
    id: "supply",
    icon: "🚛",
    image: IMG.valueChain,
    title: "Supply Chain Design",
    desc: "Cold-chain, warehousing, distribution routes and post-harvest loss reduction — designed for your volume and geography.",
    priceKES: "From KSh 160,000",
    priceUSD: "From $1,250",
    duration: "4–8 weeks",
    dept: "Logistics",
    features: [
      "Cold-chain design",
      "Warehouse layout",
      "Distribution route optimization",
      "Post-harvest loss audit",
      "Cost-to-serve model",
    ],
  },
  {
    id: "digital",
    icon: "💻",
    image: IMG.greenhouse,
    title: "Digital Solutions Build",
    desc: "Client portals, farm-management dashboards, automation and data pipelines — built on modern web tech.",
    priceKES: "From KSh 250,000",
    priceUSD: "From $1,900",
    duration: "6–12 weeks",
    dept: "Engineering",
    features: [
      "Custom client portal",
      "Farm-management dashboard",
      "Data pipeline & automation",
      "API integrations",
      "Hosting & maintenance",
    ],
  },
  {
    id: "projectmgmt",
    icon: "📋",
    image: IMG.tractorField,
    title: "Project Management",
    desc: "End-to-end execution with transparent milestones in your client portal. You always know what's happening.",
    priceKES: "From KSh 90,000",
    priceUSD: "From $700",
    duration: "Ongoing",
    dept: "All Departments",
    features: [
      "Dedicated project manager",
      "Real-time client portal",
      "Milestone tracking",
      "Weekly progress updates",
      "Deliverable management",
    ],
  },
  {
    id: "agrimind",
    icon: "📈",
    image: IMG.sproutCoins,
    title: "AgriMind AI Subscription",
    desc: "Subscription access to our AI knowledge engine built on 25+ years of agro-economic research. Ask anything, get cited answers.",
    priceKES: "KSh 15,000 / month",
    priceUSD: "$115 / month",
    duration: "Monthly",
    dept: "Product",
    features: [
      "25+ years of research",
      "Cited, field-tested answers",
      "Methodology library",
      "Living knowledge base",
      "Team seats available",
    ],
  },
];

export default function ProductsPage() {
  const navScrolled = useScrolled(40);
  const { toastMsg, showToast } = useToast(3500);
  const [currency, setCurrency] = useState<"KES" | "USD">("KES");
  const [enquiryProduct, setEnquiryProduct] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useReveal();

  const openEnquiry = (title: string) => {
    setEnquiryProduct(title);
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  const submitEnquiry = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast("Name and email are required");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("enquiries").insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        service_interest: enquiryProduct,
        message: form.message,
        source: "products_page",
        stage: "new",
      });
      if (error) throw error;
      showToast("Request received — we'll be in touch within a day.");
      setEnquiryProduct(null);
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
            <span style={{ fontWeight: 400, opacity: 0.6, fontSize: ".85rem" }}>
              &nbsp;Consultancy
            </span>
          </Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/agrimind">AgriMind</Link>
            <Link href="/products">Products</Link>
            <Link href="/#portal">Client Portal</Link>
            <Link href="/#contact">Contact</Link>
          </div>
          <Link className="btn btn-lime" href="/#contact">
            Start a Project
          </Link>
        </div>
      </nav>

      <header
        className="hero-photo"
        style={{
          backgroundImage: `url(${IMG.hexWheat})`,
          minHeight: "60vh",
        }}
      >
        <div className="hero-inner" style={{ gridTemplateColumns: "1fr" }}>
          <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
            <span className="eyebrow" style={{ color: "var(--lime)" }}>
              Our Services & Products
            </span>
            <h1 style={{ marginTop: 20 }}>
              Everything your agribusiness needs, <em>under one roof</em>.
            </h1>
            <p className="lead-hero" style={{ margin: "22px auto 0" }}>
              From bankable feasibility studies to AI-powered research, our family
              consultancy delivers across five disciplines. Transparent pricing,
              real deliverables.
            </p>

            <div className="currency-toggle" style={{ marginTop: 28 }}>
              <button
                className={currency === "KES" ? "active" : ""}
                onClick={() => setCurrency("KES")}
              >
                KES
              </button>
              <button
                className={currency === "USD" ? "active" : ""}
                onClick={() => setCurrency("USD")}
              >
                USD
              </button>
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="container">
          <span className="eyebrow">What We Offer</span>
          <h2 className="section-title">Products & services</h2>
          <p className="lead">
            Each engagement is scoped, quoted and tracked in your client portal. No
            surprises.
          </p>

          <div className="products-grid">
            {PRODUCTS.map((p) => (
              <div key={p.id} className="product-tile reveal">
                <div
                  className="product-tile-img"
                  style={{ backgroundImage: `url(${p.image})` }}
                />
                <div className="product-tile-body">
                  <div style={{ fontSize: "1.6rem", marginBottom: 10 }}>
                    {p.icon}
                  </div>
                  <h3>{p.title}</h3>
                  <div className="dept">{p.dept}</div>
                  <p>{p.desc}</p>

                  <ul>
                    {p.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>

                  <div className="price-row">
                    <div>
                      <div className="price">
                        {currency === "KES" ? p.priceKES : p.priceUSD}
                      </div>
                      <div className="duration">⏱ {p.duration}</div>
                    </div>
                  </div>

                  <button
                    className="btn btn-lime btn-block"
                    onClick={() => openEnquiry(p.title)}
                  >
                    Request Quote →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container" style={{ textAlign: "center" }}>
          <span className="eyebrow" style={{ color: "var(--lime)" }}>
            Not sure what you need?
          </span>
          <h2 className="section-title" style={{ color: "#fff" }}>
            Let's scope it together.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,.75)",
              maxWidth: 520,
              margin: "0 auto 28px",
            }}
          >
            Tell us about your project. A consultant — an actual family member, not
            a bot — replies within one business day.
          </p>
          <Link className="btn btn-lime" href="/#contact">
            Book a Consultation →
          </Link>
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

      {enquiryProduct && (
        <div className="modal-overlay" onClick={() => setEnquiryProduct(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>Request a quote</h3>
                <p>{enquiryProduct}</p>
              </div>
              <button className="modal-close" onClick={() => setEnquiryProduct(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Full name<span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email<span className="required">*</span>
                </label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Brief notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: "center", color: "#111", borderColor: "#ddd" }}
                onClick={() => setEnquiryProduct(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-lime"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={submitEnquiry}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} />
    </>
  );
}