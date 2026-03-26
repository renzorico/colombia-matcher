"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-xl font-bold text-gray-800">Algo salió mal</h2>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        {error.message || "Ocurrió un error inesperado. Intenta de nuevo."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
        >
          Inicio
        </Link>
      </div>
    </main>
  );
}
