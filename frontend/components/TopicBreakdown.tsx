import type { CandidateTopic } from "@/lib/api";
import EmptyState from "./EmptyState";

interface TopicBreakdownProps {
  topics: CandidateTopic[];
}

export default function TopicBreakdown({ topics }: TopicBreakdownProps) {
  if (topics.length === 0) {
    return <EmptyState message="Aún no hay perfiles temáticos curados para este candidato." />;
  }

  return (
    <div className="flex flex-col gap-4">
      {topics.map((t) => (
        <div key={t.topic_id} className="rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800">{t.topic_label}</h3>

          {t.plain_language_summary && (
            <div className="mt-2">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                Resumen en lenguaje sencillo
              </span>
              <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                {t.plain_language_summary}
              </p>
            </div>
          )}

          {t.summary && t.summary !== t.plain_language_summary && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                Ver descripción completa
              </summary>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                {t.summary}
              </p>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
