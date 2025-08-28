// 导入Next.js服务端响应模块
import { NextResponse } from "next/server";
// 导入Zod数据验证库，用于验证API响应格式
import { z } from "zod";

// 排除的网站列表，这些网站不适合作为学习资源
let excludedSites = ["youtube.com"];
// 搜索引擎配置：支持Bing和Serper（Google）两种搜索引擎
let searchEngine: "bing" | "serper" = "serper";

/**
 * 处理搜索信息源请求的POST接口
 * 根据用户问题搜索相关网页，为AI学习提供权威资料
 * 支持Bing和Serper两种搜索引擎
 * 
 * @param request - 包含用户问题的HTTP请求
 * @returns 返回搜索到的网页标题和URL列表
 */
export async function POST(request: Request) {
  // 从请求体中提取用户的学习问题
  let { question } = await request.json();

  // 构建最终的搜索查询，添加"what is"前缀以获得更好的解释性结果
  const finalQuestion = `what is ${question}`;

  // 如果配置使用Bing搜索引擎
  if (searchEngine === "bing") {
    // 从环境变量获取Bing API密钥
    const BING_API_KEY = process.env["BING_API_KEY"];
    if (!BING_API_KEY) {
      throw new Error("BING_API_KEY is required");
    }

    // 构建Bing搜索参数
    const params = new URLSearchParams({
      // 搜索查询，同时排除不适合的网站（如YouTube）
      q: `${finalQuestion} ${excludedSites.map((site) => `-site:${site}`).join(" ")}`,
      mkt: "en-US", // 市场设置为美国英语
      count: "6", // 返回6个搜索结果
      safeSearch: "Strict", // 启用严格的安全搜索过滤
    });

    // 调用Bing搜索API
    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?${params}`,
      {
        method: "GET",
        headers: {
          "Ocp-Apim-Subscription-Key": BING_API_KEY, // Bing API认证头
        },
      },
    );

    // 定义Bing API响应的数据结构验证模式
    const BingJSONSchema = z.object({
      webPages: z.object({
        value: z.array(z.object({ name: z.string(), url: z.string() })),
      }),
    });

    // 获取并验证Bing API的响应数据
    const rawJSON = await response.json();
    const data = BingJSONSchema.parse(rawJSON);

    // 提取搜索结果，转换为统一的格式
    let results = data.webPages.value.map((result) => ({
      name: result.name, // 网页标题
      url: result.url,   // 网页URL
    }));

    return NextResponse.json(results);
    // TODO: 考虑进一步过滤特定类型的结果（如视频网站）
  } else if (searchEngine === "serper") {
    // 从环境变量获取Serper API密钥（Google搜索代理服务）
    const SERPER_API_KEY = process.env["SERPER_API_KEY"];
    if (!SERPER_API_KEY) {
      throw new Error("SERPER_API_KEY is required");
    }

    // 调用Serper API进行Google搜索
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY, // Serper API认证头
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: finalQuestion, // 搜索查询
        num: 9, // 返回9个搜索结果
      }),
    });

    // 获取搜索结果
    const rawJSON = await response.json();

    // 定义Serper API响应的数据结构验证模式
    const SerperJSONSchema = z.object({
      organic: z.array(z.object({ title: z.string(), link: z.string() })),
    });

    // 验证并解析搜索结果
    const data = SerperJSONSchema.parse(rawJSON);

    // 将搜索结果转换为统一格式
    let results = data.organic.map((result) => ({
      name: result.title, // 网页标题
      url: result.link,   // 网页链接
    }));

    return NextResponse.json(results);
  }
}
