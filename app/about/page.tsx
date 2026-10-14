"use client";

import Link from "next/link";
import { IMG } from "@/lib/images";
import { HexGrid } from "@/components/HexGrid";
import { useScrolled, useReveal } from "@/lib/hooks";

export default function AboutPage() {
  const navScrolled = useScrolled(40);
  useReveal();

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
            <Link href="/products">Products</Link>
            <Link href="/#services">Services</Link>
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
          backgroundImage: `url(${IMG.tractorField})`,
          minHeight: "70vh",
        }}
      >
        <div className="hero-inner" style={{ gridTemplateColumns: "1fr" }}>
          <div style={{ maxWidth: 720 }}>
            <span className="eyebrow" style={{ color: "var(--lime)" }}>
              Our Story
            </span>
            <h1 style={{ marginTop: 20 }}>
              A family consultancy, <em>rooted in the soil</em>.
            </h1>
            <p className="lead-hero">
              COGAs began with one man, a lifetime of field research, and a
              conviction that agricultural science should serve the farmer who
              needs it — not sit in a library. His children turned that conviction
              into a modern consultancy.
            </p>
          </div>
        </div>
      </header>

      <section>
        <div className="container">
          <span className="eyebrow">The Founder</span>
          <h2 className="section-title">Agro-economics as a lifelong practice.</h2>
          <p className="lead">
            Decades of field studies, policy work, and value-chain analysis across
            Kenya's farming regions. Every recommendation we make today rests on
            that foundation — and on the knowledge base now structured inside
            AgriMind AI.
          </p>

          <div className="growth-banner" style={{ marginTop: 52 }}>
            <div className="growth-banner-text">
              <span className="eyebrow">Why we exist</span>
              <h2 style={{ marginTop: 14 }}>
                To make agribusiness work — for the family farm and the export
                venture alike.
              </h2>
              <p style={{ color: "var(--muted)", marginTop: 16 }}>
                Bankable feasibility. Statistically-sound trials. Actuarial risk
                models. Cold-chain logistics. Digital tools. Under one roof,
                because the farmer's problem doesn't fit in one discipline.
              </p>
            </div>
            <div
              className="growth-banner-img"
              style={{ backgroundImage: `url(${IMG.sproutCoins})` }}
            />
          </div>
        </div>
      </section>

      <section className="services">
        <div className="container">
          <span className="eyebrow">The Five Disciplines</span>
          <h2 className="section-title">One family. Five areas of expertise.</h2>

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

      <section className="cta">
        <div className="container" style={{ textAlign: "center" }}>
          <span className="eyebrow" style={{ color: "var(--lime)" }}>
            Work with us
          </span>
          <h2 className="section-title" style={{ color: "#fff" }}>
            Let's make your agribusiness work.
          </h2>
          <Link
            className="btn btn-lime"
            href="/#contact"
            style={{ marginTop: 20 }}
          >
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
    </>
  );
}