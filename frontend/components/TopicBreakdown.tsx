import type { CandidateTopic } from "@/lib/api";
import EmptyState from "./EmptyState";

function confidenceLabel(confidence: number | null | undefined): { label: string; cls: string } | null {
  if (confidence === null || confidence === undefined) return null;
  if (confidence >= 0.8) return { label: "Alta confianza", cls: "text-green-600" };
  if (confidence >= 0.5) return { label: "Confianza media", cls: "text-amber-600" };
  return { label: "Confianza baja", cls: "text-red-500" };
}

interface TopicBreakdownProps {
  topics: CandidateTopic[];
}

export default function TopicBreakdown({ topics }: TopicBreakdownProps) {
  if (topics.length === 0) {
    return <EmptyState message="Aún no hay perfiles temáticos curados para este candidato." />;
  }

  return (
    <div className="flex flex-col gap-4">
      {topics.map((t) => {
        const conf = confidenceLabel(t.confidence);
        return (
          <div key={t.topic_id} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-800">{t.topic_label}</h3>
              {conf && (
                <span className={`text-xs ${conf.cls}`}>{conf.label}</span>
              )}
            </div>

            {t.plain_language_summary ? (
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                {t.plain_language_summary}
              </p>
            ) : t.summary ? (
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{t.summary}</p>
            ) : null}

            {t.summary && t.plain_language_summary && t.summary !== t.plain_language_summary && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 select-none">
                  Ver análisis completo
                </summary>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  {t.summary}
                </p>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}
