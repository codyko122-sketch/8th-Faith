"use client";
//
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/ingredients", label: "성분 검색" },
];

export function SiteNav() {
  const pathname = usePathname();

  // '성분 검색' 클릭 시 검색창으로 올라가 바로 검색할 수 있게.
  // 같은 페이지면 즉시 스크롤+포커스, 다른 페이지면 이동 후 페이지의 자동 포커스가 처리.
  function focusIngredientSearch() {
    requestAnimationFrame(() => {
      const el = document.getElementById("ingredient-search") as HTMLInputElement | null;
      if (el) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        el.focus({ preventScroll: true });
      }
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#eee] bg-white/90 font-sans backdrop-blur-md">
      <div className="mx-auto flex max-w-[480px] items-center gap-4 px-6 py-3.5">
        <Link
          href="/"
          className="text-[18px] font-black tracking-[-0.01em] text-[#0a0a0a]"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          BEAUTY PASSPORT
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-[13px]">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={l.href === "/ingredients" ? focusIngredientSearch : undefined}
                className={`rounded-full px-3.5 py-1.5 font-bold transition ${
                  active ? "bg-[#0a0a0a] text-white" : "text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#0a0a0a]"
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
