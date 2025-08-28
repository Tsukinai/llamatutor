// 导入Mozilla的Readability库，用于提取网页核心内容
import { Readability } from "@mozilla/readability";
// 导入JSDOM库，用于在服务端模拟浏览器DOM环境
import jsdom, { JSDOM } from "jsdom";
// 导入自定义工具函数：文本清理和带超时的网络请求
import { cleanedText, fetchWithTimeout } from "@/utils/utils";
// 导入Next.js服务端响应模块
import { NextResponse } from "next/server";

// 设置最大执行时间为30秒，防止网页解析过程过长
export const maxDuration = 30;

/**
 * 处理网页内容解析请求的POST接口
 * 接收搜索到的网页URL列表，提取每个网页的核心文本内容
 * 使用Mozilla Readability算法去除广告、导航等干扰元素
 * 
 * @param request - 包含网页URL列表的HTTP请求
 * @returns 返回包含解析后文本内容的网页信息列表
 */
export async function POST(request: Request) {
  // 从请求体中提取网页源列表
  let { sources } = await request.json();

  console.log("[getAnswer] Fetching text from source URLS");

  // 并行处理所有网页，提高效率
  let finalResults = await Promise.all(
    sources.map(async (result: any) => {
      try {
        // 获取网页HTML内容，设置3秒超时以避免长时间等待
        const response = await fetchWithTimeout(result.url);
        const html = await response.text();

        // 创建虚拟控制台以抑制JSDOM的警告信息
        const virtualConsole = new jsdom.VirtualConsole();
        // 在服务端创建DOM环境，模拟浏览器解析HTML
        const dom = new JSDOM(html, { virtualConsole });

        // 获取文档对象
        const doc = dom.window.document;
        // 使用Mozilla Readability算法提取文章主要内容
        const parsed = new Readability(doc).parse();

        // 如果成功解析，清理文本格式；否则返回默认消息
        let parsedContent = parsed
          ? cleanedText(parsed.textContent) // 清理多余空格、换行等格式问题
          : "Nothing found";

        // 返回原始信息加上解析后的完整内容
        return {
          ...result,
          fullContent: parsedContent, // 添加解析后的网页文本内容
        };
      } catch (e) {
        // 如果解析失败（网络错误、解析错误等），记录错误并返回不可用状态
        console.log(`error parsing ${result.name}, error: ${e}`);
        return {
          ...result,
          fullContent: "not available", // 标记内容不可用
        };
      }
    }),
  );

  return NextResponse.json(finalResults);
}
