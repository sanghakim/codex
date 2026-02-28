import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TransLingo - 다국어 번역 서비스",
  description:
    "텍스트, 이미지, 문서, 서식을 20개 이상의 언어로 번역하는 다국어 번역 웹서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
