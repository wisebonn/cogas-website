"use client";

import { ReactNode } from "react";
import { IMG } from "@/lib/images";

interface ModuleHeroProps {
  title: string;
  subtitle?: string;
  image?: string;
  actions?: ReactNode;
}

export function ModuleHero({
  title,
  subtitle,
  image,
  actions,
}: ModuleHeroProps) {
  const bg = image || IMG.heroFieldFallback;

  return (
    <div
      className="module-hero"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div>}
      </div>
    </div>
  );
}