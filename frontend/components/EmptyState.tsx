interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({
  message = "Aún no hay información curada en esta sección.",
}: EmptyStateProps) {
  return (
    <p className="rounded-lg border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-400 text-center">
      {message}
    </p>
  );
}
