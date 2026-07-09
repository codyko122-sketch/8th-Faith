"use client";
//
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/diagnose", label: "진단 시작" },
  { href: "/ingredients", label: "성분 검색" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-semibold tracking-tight">
          <span aria-hidden className="text-xl">🛂</span>
          Beauty <span className="text-accent">Passport</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-2 transition-colors ${
                  active
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-accent-soft hover:text-accent-dark"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
