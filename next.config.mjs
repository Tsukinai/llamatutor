/** @type {import('next').NextConfig} */
/**
 * Next.js应用配置文件
 * 定义应用的各种配置选项，包括图片处理、构建优化等
 */
const nextConfig = {
  // 图片优化配置
  images: {
    // 允许的远程图片域名模式
    remotePatterns: [
      {
        hostname: "www.google.com", // 允许从Google加载图片（用于网站图标）
      },
    ],
  },
};

export default nextConfig;
