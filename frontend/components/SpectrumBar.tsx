const SPECTRUM_POSITIONS: Record<string, number> = {
  left: 0,
  "center-left": 25,
  center: 50,
  "center-right": 75,
  right: 100,
  "far-right": 100,
};

export const SPECTRUM_LABELS: Record<string, string> = {
  left:           "Izquierda",
  "center-left":  "Centro-izquierda",
  center:         "Centro",
  "center-right": "Centro-derecha",
  right:          "Derecha",
  "far-right":    "Derecha radical",
};

export function SpectrumBar({ spectrum }: { spectrum: string }) {
  const pct   = SPECTRUM_POSITIONS[spectrum] ?? 50;
  const label = SPECTRUM_LABELS[spectrum]    ?? spectrum;

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Label */}
      <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
        {label}
      </span>

      {/* Bar row + tick-labels below, wrapped so they share the same width */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] flex-shrink-0" style={{ color: "var(--muted)" }}>Izq.</span>

        <div className="flex-1 flex flex-col gap-0.5">
          {/* Track + dot */}
          <div
            className="relative h-2.5 rounded-full"
            style={{
              background: "linear-gradient(to right, #CBD5E0, #A0AEC0, #CBD5E0)",
            }}
          >
            {/* Tick marks at 25 / 50 / 75% */}
            {[25, 50, 75].map((t) => (
              <div
                key={t}
                className="absolute top-0 h-full w-px bg-white/60"
                style={{ left: `${t}%` }}
              />
            ))}

            {/* Position dot — neutral dark */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md"
              style={{
                left: `calc(${pct}% - 8px)`,
                backgroundColor: "#1A1A1A",
              }}
            />
          </div>

          {/* Tick labels — exactly the same width as the bar above */}
          <div className="flex justify-between text-[9px]" style={{ color: "var(--muted)" }}>
            <span>Izq.</span>
            <span>C-Izq.</span>
            <span>Centro</span>
            <span>C-Der.</span>
            <span>Der.</span>
          </div>
        </div>

        <span className="text-[10px] flex-shrink-0" style={{ color: "var(--muted)" }}>Der.</span>
      </div>
    </div>
  );
}
