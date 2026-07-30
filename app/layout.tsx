import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://left-foot-right-foot-lab.frobel0520.chatgpt.site",
  ),
  title: "左腳踩右腳：永動機研究所",
  description:
    "十個世界、十組閉環。分配有限資源，打造能夠自我增長的永動系統。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "左腳踩右腳：永動機研究所",
    description: "從失控鍋爐房一路解到宇宙自舉的十關數值閉環解謎遊戲。",
    type: "website",
    locale: "zh_TW",
    images: [
      {
        url: "/og.png",
        width: 1736,
        height: 908,
        alt: "左腳踩右腳：永動機研究所的十個閉環世界",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "左腳踩右腳：永動機研究所",
    description: "十個世界、十組閉環、一條無限成長之路。",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
