import type { CandidateTopic } from "@/lib/api";
import { TOPIC_COLORS } from "@/lib/topics";
import EmptyState from "./EmptyState";

function confidenceLabel(confidence: number | null | undefined): string | null {
  if (confidence === null || confidence === undefined) return null;
  if (confidence >= 0.8) return "Alta confianza";
  if (confidence >= 0.5) return "Confianza media";
  return "Confianza baja";
}

const STANCE_LABELS: Record<number, string> = {
  1: "Muy progresista",
  2: "Centro-izquierda",
  3: "Centro",
  4: "Centro-derecha",
  5: "Muy conservador/a",
};

interface TopicBreakdownProps {
  topics: CandidateTopic[];
}

export default function TopicBreakdown({ topics }: TopicBreakdownProps) {
  if (topics.length === 0) {
    return <EmptyState message="Aún no hay perfiles temáticos curados para este candidato." />;
  }

  return (
    <div className="flex flex-col gap-5">
      {topics.map((t) => {
        const color = TOPIC_COLORS[t.topic_id] ?? "#4A4A4A";
        const barPct = t.stance_score != null ? (t.stance_score / 5) * 100 : null;
        const conf = confidenceLabel(t.confidence);
        const stanceLabel = t.stance_score != null ? STANCE_LABELS[t.stance_score] : null;

        return (
          <div
            key={t.topic_id}
            className="rounded-xl p-4 bg-surface"
            style={{ border: "1px solid var(--border)", borderLeft: `4px solid ${color}` }}
          >
            {/* Topic name + stance label */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                {t.topic_label}
              </h3>
              {stanceLabel && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${color}18`, color }}
                >
                  {stanceLabel}
                </span>
              )}
            </div>

            {/* Bar chart */}
            {barPct != null && (
              <div className="mt-3">
                <div
                  className="relative h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--border)" }}
                >
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all"
                    style={{ width: `${barPct}%`, backgroundColor: color }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px]" style={{ color: "var(--muted)" }}>
                  <span>Izquierda</span>
                  <span>Derecha</span>
                </div>
              </div>
            )}

            {/* Summary text */}
            {t.plain_language_summary ? (
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                {t.plain_language_summary}
              </p>
            ) : t.summary ? (
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                {t.summary}
              </p>
            ) : null}

            {/* Collapsible full summary */}
            {t.summary && t.plain_language_summary && t.summary !== t.plain_language_summary && (
              <details className="mt-2">
                <summary
                  className="cursor-pointer text-xs select-none"
                  style={{ color: "var(--muted)" }}
                >
                  Ver análisis completo
                </summary>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {t.summary}
                </p>
              </details>
            )}

            {/* Confidence */}
            {conf && (
              <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                {conf}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
