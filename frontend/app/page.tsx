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
      <Link
        href="/quiz"
        className="mt-8 rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow hover:bg-blue-700 transition"
      >
        Comenzar
      </Link>
    </main>
  );
}
