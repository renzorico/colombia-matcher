import type { Source } from "@/lib/api";
import EmptyState from "./EmptyState";

const TYPE_LABELS: Record<string, string> = {
  official_program:   "Programa oficial",
  official_statement: "Declaración oficial",
  interview:          "Entrevista",
  news:               "Noticia",
  analysis:           "Análisis",
  speech:             "Discurso",
  social_media:       "Redes sociales",
};

interface SourceListProps {
  sources: Source[];
}

export default function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) {
    return (
      <EmptyState message="No hay fuentes con URL disponible para este candidato." />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {sources.map((s) => (
        <li key={s.id} className="flex items-start gap-3 text-sm">
          <span className="mt-0.5 flex-shrink-0 text-gray-300">→</span>
          <div className="min-w-0">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline leading-snug"
            >
              {s.title ?? s.url}
            </a>
            <p className="mt-0.5 text-xs text-gray-400 flex flex-wrap gap-x-2">
              {s.publisher && <span>{s.publisher}</span>}
              {s.published_at && <span>· {s.published_at}</span>}
              {s.type && (
                <span className="rounded bg-gray-100 px-1.5 py-px text-gray-500">
                  {TYPE_LABELS[s.type] ?? s.type}
                </span>
              )}
            </p>
            {s.reliability_notes && (
              <p className="mt-1 text-xs text-amber-700 italic leading-snug">
                {s.reliability_notes}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
