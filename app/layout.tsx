import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Jua } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

const jua = Jua({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-jua",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beauty Passport — 여름 여행 뷰티 여권",
  description:
    "뷰티 여권으로 떠나는 여름 여행. 여행지 기후와 내 피부를 결합한 몰입형 맞춤 스킨케어 경험.",
};

export const viewport: Viewport = {
  themeColor: "#7fd0f5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${notoSans.variable} ${jua.variable}`}>
      <body>{children}</body>
    </html>
  );
}
