"use client";

interface HexItem {
  icon: string;
  label: string;
}

interface HexGridProps {
  items?: HexItem[];
}

const DEFAULT_ITEMS: HexItem[] = [
  { icon: "🌾", label: "Crops" },
  { icon: "🚜", label: "Machinery" },
  { icon: "💧", label: "Irrigation" },
  { icon: "☀️", label: "Climate" },
  { icon: "🧪", label: "Soil" },
  { icon: "🚁", label: "Drones" },
  { icon: "🐄", label: "Livestock" },
  { icon: "📊", label: "Analytics" },
];

export function HexGrid({ items = DEFAULT_ITEMS }: HexGridProps) {
  return (
    <div className="hex-grid">
      {items.map((item, i) => (
        <div className="hex" key={i} title={item.label}>
          <span aria-hidden="true">{item.icon}</span>
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}