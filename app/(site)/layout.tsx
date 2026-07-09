import { SiteNav } from "@/components/site-nav";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main>{children}</main>
      <footer className="mx-auto max-w-5xl px-6 py-10 text-sm text-muted">
        Beauty Passport · 시나리오 2 Global Beauty · 프로토타입
      </footer>
    </>
  );
}
