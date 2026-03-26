import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
        ¿Con quién votas?
      </h1>
      <p className="mt-4 max-w-md text-lg text-gray-600">
        Responde 25 preguntas y descubre qué candidato presidencial se acerca
        más a tus ideas.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href="/quiz"
          className="rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow hover:bg-blue-700 transition"
        >
          Comenzar
        </Link>
        <Link
          href="/candidatos"
          className="text-sm text-gray-500 hover:text-gray-800 transition"
        >
          Ver candidatos →
        </Link>
      </div>
    </main>
  );
}
