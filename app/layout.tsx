// 导入Next.js元数据类型定义
import type { Metadata } from "next";
// 导入Google字体Montserrat
import { Montserrat } from "next/font/google";
// 导入Plausible分析服务提供者组件
import PlausibleProvider from "next-plausible";
// 导入全局CSS样式
import "./globals.css";
// 导入Next.js图片组件
import Image from "next/image";
// 导入背景图片
import bgImage from "../public/new-bg.png";

// 配置Montserrat字体，支持拉丁字符集
const montserrat = Montserrat({ subsets: ["latin"] });

// 网站元数据配置
let title = "Llama Tutor – AI Personal Tutor"; // 网站标题
let description = "Learn faster with our open source AI personal tutor"; // 网站描述
let url = "https://llamatutor.com/"; // 网站URL
let ogimage = "https://llamatutor.together.ai/og-image.png"; // Open Graph图片
let sitename = "llamatutor.com"; // 网站名称

/**
 * 网站元数据配置
 * 定义SEO相关信息，包括Open Graph和Twitter卡片
 */
export const metadata: Metadata = {
  metadataBase: new URL(url), // 设置基础URL，用于相对路径解析
  title, // 页面标题
  description, // 页面描述
  icons: {
    icon: "/favicon.ico", // 网站图标
  },
  // Open Graph元数据（用于社交媒体分享）
  openGraph: {
    images: [ogimage], // 分享时显示的图片
    title, // 分享时的标题
    description, // 分享时的描述
    url: url, // 分享的URL
    siteName: sitename, // 网站名称
    locale: "en_US", // 语言区域设置
    type: "website", // 内容类型
  },
  // Twitter卡片元数据
  twitter: {
    card: "summary_large_image", // 卡片类型：带大图的摘要
    images: [ogimage], // 卡片图片
    title, // 卡片标题
    description, // 卡片描述
  },
};

/**
 * 根布局组件
 * 为整个应用提供基础的HTML结构、全局样式和第三方服务集成
 * 
 * @param children - 子页面组件
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* 集成Plausible网站分析服务 */}
        <PlausibleProvider domain="llamatutor.together.ai" />
      </head>

      <body
        className={`${montserrat.className} flex h-full flex-col justify-between text-gray-700 antialiased`}
      >
        {/* 背景图片：固定在页面最底层，略微模糊处理 */}
        <Image
          src={bgImage}
          alt="" // 装饰性图片，不需要alt文本
          className="absolute inset-0 -z-10 max-h-full max-w-full blur-[2px]"
        />
        {/* 渲染子页面内容 */}
        {children}
      </body>
    </html>
  );
}
