import Link from "next/link";

export default function NavBar() {
  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight text-gray-900 hover:text-blue-600 transition"
        >
          ¿Por quién votarás?
        </Link>
        <div className="flex items-center gap-5 text-sm text-gray-500">
          <Link href="/candidatos" className="hover:text-gray-900 transition">
            Candidatos
          </Link>
          <Link href="/quiz" className="hover:text-gray-900 transition">
            Quiz
          </Link>
          <Link href="/metodologia" className="hover:text-gray-900 transition">
            Metodología
          </Link>
          <Link
            href="/bajo-el-capo"
            className="text-xs text-gray-400 hover:text-gray-700 transition"
          >
            Bajo el capó
          </Link>
        </div>
      </nav>
    </header>
  );
}
