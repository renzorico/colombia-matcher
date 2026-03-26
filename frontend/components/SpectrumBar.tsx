const SPECTRUM_POSITIONS: Record<string, number> = {
  left: 0,
  "center-left": 25,
  center: 50,
  "center-right": 75,
  right: 100,
  "far-right": 100,
};

const DOT_COLORS: Record<string, string> = {
  left:           "#4A6FA5",
  "center-left":  "#5C8A6B",
  center:         "#6B6B6B",
  "center-right": "#D4813A",
  right:          "#C4622D",
  "far-right":    "#9B2226",
};

export const SPECTRUM_LABELS: Record<string, string> = {
  left:           "Izquierda",
  "center-left":  "Centro-izquierda",
  center:         "Centro",
  "center-right": "Centro-derecha",
  right:          "Derecha",
  "far-right":    "Derecha radical",
};

const TICKS = [
  { pct: 0,   label: "Izq." },
  { pct: 25,  label: "C-Izq." },
  { pct: 50,  label: "Centro" },
  { pct: 75,  label: "C-Der." },
  { pct: 100, label: "Der." },
];

export function SpectrumBar({ spectrum }: { spectrum: string }) {
  const pct      = SPECTRUM_POSITIONS[spectrum] ?? 50;
  const label    = SPECTRUM_LABELS[spectrum]    ?? spectrum;
  const dotColor = DOT_COLORS[spectrum]         ?? "#6B6B6B";

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label pill */}
      <span
        className="self-start rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
        style={{ backgroundColor: dotColor }}
      >
        {label}
      </span>

      {/* Track + dot */}
      <div
        className="relative h-2.5 rounded-full"
        style={{
          background:
            "linear-gradient(to right, #4A6FA5 0%, #5C8A6B 25%, #9E9E9E 50%, #D4813A 75%, #C4622D 100%)",
        }}
      >
        {/* Tick marks */}
        {TICKS.map((t) => (
          <div
            key={t.pct}
            className="absolute top-0 h-full w-px bg-white/50"
            style={{ left: `${t.pct}%` }}
          />
        ))}

        {/* Position dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md"
          style={{
            left: `calc(${pct}% - 8px)`,
            backgroundColor: dotColor,
            boxShadow: `0 0 0 2px ${dotColor}40, 0 1px 4px rgba(0,0,0,0.25)`,
          }}
        />
      </div>

      {/* Tick labels */}
      <div className="relative h-3">
        {TICKS.map((t) => (
          <span
            key={t.pct}
            className="absolute text-[9px] text-gray-400 -translate-x-1/2"
            style={{ left: `${t.pct}%` }}
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
