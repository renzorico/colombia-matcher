const SPECTRUM_POSITIONS: Record<string, number> = {
  left: 0,
  "center-left": 20,
  center: 40,
  "center-right": 60,
  right: 80,
  "far-right": 100,
};

export const SPECTRUM_LABELS: Record<string, string> = {
  left: "Izquierda",
  "center-left": "Centro-izquierda",
  center: "Centro",
  "center-right": "Centro-derecha",
  right: "Derecha",
  "far-right": "Derecha radical",
};

export function SpectrumBar({ spectrum }: { spectrum: string }) {
  const pct = SPECTRUM_POSITIONS[spectrum] ?? 50;
  const label = SPECTRUM_LABELS[spectrum] ?? spectrum;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-400 flex-shrink-0">Izq.</span>
        <div
          className="relative flex-1 h-1 bg-gray-200 rounded-full"
          style={{ minWidth: "60px" }}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-gray-500 border-2 border-white shadow-sm"
            style={{ left: `calc(${pct}% - 6px)` }}
          />
        </div>
        <span className="text-[10px] text-gray-400 flex-shrink-0">Der.</span>
      </div>
    </div>
  );
}
