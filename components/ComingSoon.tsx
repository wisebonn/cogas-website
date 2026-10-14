"use client";

import { useState, ReactNode } from "react";

// ────────────────────────────────────────────────────────────
// ComingSoonBadge — inline pill badge
// ────────────────────────────────────────────────────────────
export function ComingSoonBadge({ label = "Coming soon" }: { label?: string }) {
  return <span className="soon-badge">{label}</span>;
}

// ────────────────────────────────────────────────────────────
// ComingSoonButton — button that opens a "coming soon" modal
// ────────────────────────────────────────────────────────────
export function ComingSoonButton({
  feature,
  description,
  className = "btn btn-lime",
  label,
}: {
  feature: string;
  description?: string;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={className} onClick={() => setOpen(true)} type="button">
        {label || feature} <ComingSoonBadge label="Soon" />
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>{feature}</h3>
                <p>This feature is on the roadmap</p>
              </div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="info-banner">
                <b>◐ Coming soon</b>
                <p style={{ marginTop: 8, lineHeight: 1.55 }}>
                  {description ||
                    `${feature} is being built. You'll see it in the portal the moment it goes live. Nothing to configure on your end.`}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  background: "#f3f4f6",
                  color: "#111",
                }}
                onClick={() => setOpen(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────
// ComingSoonPage — full-page placeholder for unbuilt routes
// ────────────────────────────────────────────────────────────
export function ComingSoonPage({
  title,
  description,
  bullets,
  image,
}: {
  title: string;
  description: string;
  bullets?: string[];
  image?: string;
}) {
  return (
    <div>
      {image && (
        <div
          className="module-hero"
          style={{ backgroundImage: `url(${image})`, minHeight: 240 }}
        >
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
      )}

      {!image && (
        <div className="panel" style={{ marginTop: 0, marginBottom: 24 }}>
          <h3>{title}</h3>
          <p style={{ color: "rgba(255,255,255,.65)", marginTop: 8, maxWidth: 640 }}>
            {description}
          </p>
        </div>
      )}

      <div className="panel" style={{ textAlign: "center", padding: "56px 24px" }}>
        <div style={{ fontSize: "3rem", marginBottom: 12 }}>🌱</div>
        <div style={{ marginBottom: 16 }}>
          <ComingSoonBadge label="In development" />
        </div>
        <h3 style={{ color: "#fff", marginBottom: 10 }}>We're building this</h3>
        <p
          style={{
            color: "rgba(255,255,255,.6)",
            maxWidth: 460,
            margin: "0 auto",
            fontSize: ".9rem",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>

        {bullets && bullets.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "28px auto 0",
              maxWidth: 520,
              textAlign: "left",
            }}
          >
            {bullets.map((b, i) => (
              <li
                key={i}
                style={{
                  padding: "8px 0",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: ".86rem",
                  color: "rgba(255,255,255,.75)",
                  borderBottom: "1px solid rgba(255,255,255,.06)",
                }}
              >
                <span style={{ color: "#a3e635", fontWeight: 700, flex: "none" }}>
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// ComingSoonWrapper — wraps any block, shows badge + tooltip
// ────────────────────────────────────────────────────────────
export function ComingSoonWrapper({
  children,
  feature,
}: {
  children: ReactNode;
  feature: string;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{ position: "relative", display: "inline-block", width: "100%" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {hover && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid rgba(255,255,255,.12)",
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: ".75rem",
            zIndex: 100,
            boxShadow: "0 12px 30px rgba(0,0,0,.5)",
            pointerEvents: "none",
          }}
        >
          <b style={{ color: "#a3e635" }}>◐ {feature}</b>
          <div style={{ color: "rgba(255,255,255,.7)", marginTop: 4 }}>
            Coming soon
          </div>
        </div>
      )}
    </div>
  );
}