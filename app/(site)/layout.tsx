// 메인 앱(app/page.tsx)과 같은 "여권 카드" 프레임(그라데이션 배경 + 가운데 정렬된 둥근
// 카드)을 그대로 재사용해서, 앱에서 성분 검색으로 넘어와도 같은 화면이 이어지는 것처럼 보이게 한다.
// 이 그룹에는 더 이상 별도 상단바·푸터를 두지 않는다 — 각 페이지가 메인 앱의 스테이지 화면들과
// 동일한 방식(자체 뒤로가기 버튼 + 타이틀)으로 헤더를 그린다.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] w-full" style={{ background: "linear-gradient(180deg,#c6dcec,#aecbe2)" }}>
      <div className="mx-auto flex min-h-[100dvh] max-w-[480px] items-stretch sm:py-6">
        <div className="relative w-full overflow-hidden min-h-[100dvh] bg-white sm:min-h-[calc(100dvh-3rem)] sm:rounded-[38px] sm:shadow-[0_40px_90px_rgba(43,120,170,0.4)]">
          {children}
        </div>
      </div>
    </div>
  );
}
