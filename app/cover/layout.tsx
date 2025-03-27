import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'WebShaper - 小红书封面生成',
  description: '专业的小红书封面生成工具，支持多种风格模板，智能排版，一键生成精美封面。',
  icons: {
    icon: '/mainpage.svg',
  },
};

export default function CoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 