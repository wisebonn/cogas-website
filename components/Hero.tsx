"use client";

import { useEffect, useState } from "react";
import { IMG } from "@/lib/images";

interface HeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  stats?: { value: number; suffix?: string; label: string }[];
  backgroundImage?: string;
  showLiveCard?: boolean;
}

export function Hero({
  eyebrow = "Family-run · Science-led · Africa-focused",
  title,
  subtitle,
  primaryCta = { label: "Book a Consultation →", href: "#contact" },
  secondaryCta = { label: "Team Portal", href: "/team" },
  stats = [
    { value: 25, suffix: "+", label: "Years of agro-economic research" },
    { value: 120, suffix: "+", label: "Farm & agri-SME clients advised" },
    { value: 14, suffix: "", label: "Value-chain studies completed" },
  ],
  backgroundImage = IMG.heroField,
  showLiveCard = true,
}: HeroProps) {
  const [failed, setFailed] = useState(false);
  const [counts, setCounts] = useState<number[]>(stats.map(() => 0));

  // Animate the stat counters on mount
  useEffect(() => {
    const timers = stats.map((s, i) => {
      const duration = 1200 + i * 150;
      const start = performance.now();
      let raf: number;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setCounts((prev) => {
          const next = [...prev];
          next[i] = Math.round(s.value * eased);
          return next;
        });
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    });
    return () => timers.forEach((fn) => fn());
  }, [stats]);

  // Preload the image and fall back gracefully
  useEffect(() => {
    if (!backgroundImage) return;
    const img = new Image();
    img.src = backgroundImage;
    img.onerror = () => setFailed(true);
  }, [backgroundImage]);

  const bg = failed ? IMG.heroFieldFallback : backgroundImage;

  return (
    <header className="hero-photo" style={{ backgroundImage: `url(${bg})` }}>
      <div className="hero-inner">
        <div>
          <span
            className="eyebrow"
            style={{ color: "var(--lime)", borderColor: "rgba(163,230,53,.3)" }}
          >
            {eyebrow}
          </span>

          <h1 style={{ marginTop: 20 }}>{title}</h1>

          <p className="lead-hero">{subtitle}</p>

          <div className="hero-cta" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <a className="btn btn-lime" href={primaryCta.href}>
              {primaryCta.label}
            </a>
            {secondaryCta && (
              <a className="btn btn-ghost" href={secondaryCta.href}>
                {secondaryCta.label}
              </a>
            )}
          </div>

          <div className="hero-stats" style={{ display: "flex", gap: 40, marginTop: 56, flexWrap: "wrap" }}>
            {stats.map((s, i) => (
              <div className="stat" key={i}>
                <b>
                  {counts[i]}
                  {s.suffix}
                </b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {showLiveCard && (
          <div className="hero-card">
            <h3>🔴 Live client portal — preview</h3>

            <div className="mini-row">
              <span>Greenhouse Feasibility — Nakuru</span>
              <span className="pill pill-green">On track</span>
            </div>
            <div className="bar">
              <i style={{ width: "68%" }}></i>
            </div>

            <div className="mini-row" style={{ marginTop: 14 }}>
              <span>Maize Value-Chain Study</span>
              <span className="pill pill-gold">Review</span>
            </div>
            <div className="bar">
              <i style={{ width: "82%" }}></i>
            </div>

            <div className="mini-row" style={{ marginTop: 14 }}>
              <span>Dairy Market Entry Strategy</span>
              <span className="pill pill-green">On track</span>
            </div>
            <div className="bar">
              <i style={{ width: "41%" }}></i>
            </div>

            <div className="mini-row" style={{ marginTop: 18 }}>
              <span style={{ color: "rgba(255,255,255,.55)" }}>Next milestone</span>
              <span>Field survey · Fri 09:00</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}