// 导入Next.js中间件相关类型
import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js中间件函数
 * 在请求到达页面之前进行预处理
 * 主要用于地理位置访问控制和安全防护
 * 
 * @param req - Next.js请求对象，包含地理位置信息
 * @returns NextResponse - 响应对象或继续处理指令
 */
export async function middleware(req: NextRequest) {
  // 获取请求来源的国家代码
  let country = req.geo?.country;

  // 临时阻止来自印度的流量，因为检测到滥用行为
  // 这是一个临时的地理位置限制措施
  if (country === "IN") {
    return new NextResponse("Access Denied", { status: 403 });
  }

  // 允许其他地区的请求继续处理
  return NextResponse.next();
}

/**
 * 中间件配置
 * 指定中间件应用的路径范围
 */
export const config = {
  matcher: "/:path*", // 应用到所有路由路径
};
