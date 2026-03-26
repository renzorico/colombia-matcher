import type { Source } from "@/lib/api";
import EmptyState from "./EmptyState";

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
    <ul className="flex flex-col gap-2">
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
            <p className="mt-0.5 text-xs text-gray-400">
              {s.publisher ?? "Fuente desconocida"}
              {s.published_at ? ` · ${s.published_at}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
