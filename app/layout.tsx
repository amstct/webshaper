import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'WebShaper - AI 驱动的网页内容生成工具',
  description: 'WebShaper 是一个专业的 AI 驱动工具，提供小红书风格封面设计和信息卡片生成服务。',
  icons: {
    icon: '/mainpage.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>
        {children}
      </body>
    </html>
  );
}
