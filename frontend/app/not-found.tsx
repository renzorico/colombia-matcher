import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-extrabold" style={{ color: "var(--primary)" }}>404</p>
      <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
        Página no encontrada
      </p>
      <p className="text-sm max-w-sm" style={{ color: "var(--muted)" }}>
        La página que buscas no existe. Puede que la URL sea incorrecta o que la página haya sido movida.
      </p>
      <div className="flex gap-3 flex-wrap justify-center mt-2">
        <Link
          href="/"
          className="rounded-full px-6 py-2 text-sm font-bold shadow transition hover:opacity-90"
          style={{ backgroundColor: "var(--primary)", color: "#1A1A1A" }}
        >
          Ir al inicio
        </Link>
        <Link
          href="/candidatos"
          className="rounded-full px-6 py-2 text-sm font-semibold transition"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
        >
          Ver candidatos
        </Link>
      </div>
    </main>
  );
}
