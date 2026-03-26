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

      {/* Track + dot */}
      <div
        className="relative h-1 rounded-full"
        style={{
          background: "linear-gradient(to right, #CBD5E0, #A0AEC0, #CBD5E0)",
        }}
      >
        {/* Position dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
          style={{
            width: 10,
            height: 10,
            left: `calc(${pct}% - 5px)`,
            backgroundColor: "#1A1A1A",
          }}
        />
      </div>

      {/* 3 tick labels */}
      <div className="flex justify-between text-[9px]" style={{ color: "var(--muted)" }}>
        <span>Izquierda</span>
        <span>Centro</span>
        <span>Derecha</span>
      </div>
    </div>
  );
}
