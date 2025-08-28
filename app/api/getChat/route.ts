// 导入AI流处理相关模块
import {
  OpenAIStream,
  OpenAIStreamPayload,
} from "@/utils/OpenAIStream";
// 导入速率限制相关模块
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
// 导入Next.js请求头处理模块
import { headers } from "next/headers";

// 速率限制器实例，可能为undefined（如果未配置Redis）
let ratelimit: Ratelimit | undefined;

// 如果设置了Upstash Redis环境变量，则启用速率限制
// 否则跳过速率限制功能
if (process.env.UPSTASH_REDIS_REST_URL) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(), // 从环境变量创建Redis连接
    // 限制策略：每24小时（1440分钟）允许10次请求
    limiter: Ratelimit.fixedWindow(10, "1440 m"),
    analytics: true, // 启用分析功能
    prefix: "llamatutor", // Redis键前缀，用于区分不同应用
  });
}

/**
 * 处理聊天请求的POST接口
 * 这是应用的核心API，负责与AI模型进行对话交互
 * 
 * @param request - 包含消息历史的HTTP请求
 * @returns 返回AI模型的流式响应
 */
export async function POST(request: Request) {
  // 从请求体中提取消息历史数组
  let { messages } = await request.json();

  // 如果启用了速率限制，检查当前IP的请求频率
  if (ratelimit) {
    const identifier = getIPAddress(); // 获取客户端IP地址作为标识符

    // 检查是否超出速率限制（每24小时10次）
    const { success } = await ratelimit.limit(identifier);
    if (!success) {
      // 如果超出限制，返回429状态码（Too Many Requests）
      return Response.json("No requests left. Try again in 24h.", {
        status: 429,
      });
    }
  }

  try {
    // 构建发送给OpenAI的请求负载
    const payload: OpenAIStreamPayload = {
      model: "gpt-3.5-turbo", // 使用GPT-3.5-turbo模型
      messages, // 包含系统提示和用户消息的对话历史
      stream: true, // 启用流式响应，实现实时输出
      temperature: 0.7, // 控制回复的创造性
      max_tokens: 2000, // 限制最大回复长度
    };

    // 调用OpenAI API并获取流式响应
    const stream = await OpenAIStream(payload);

    // 返回流式响应给前端，设置不缓存头部
    return new Response(stream, {
      headers: new Headers({
        "Cache-Control": "no-cache", // 禁用缓存，确保每次都是实时响应
      }),
    });
  } catch (e) {
    // 如果OpenAI服务出错，返回202状态码和错误信息
    return new Response("Error. OpenAI stream failed.", { status: 202 });
  }
}

// 使用Edge Runtime以获得更好的性能和更低的延迟
export const runtime = "edge";

/**
 * 获取客户端真实IP地址的工具函数
 * 用于速率限制和日志记录
 * 
 * @returns 客户端IP地址字符串
 */
function getIPAddress() {
  const FALLBACK_IP_ADDRESS = "0.0.0.0"; // 默认IP地址，当无法获取真实IP时使用

  // 尝试从x-forwarded-for头部获取IP（适用于负载均衡器或代理）
  const forwardedFor = headers().get("x-forwarded-for");

  if (forwardedFor) {
    // x-forwarded-for可能包含多个IP，取第一个（最原始的客户端IP）
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  // 如果没有x-forwarded-for，尝试从x-real-ip头部获取
  return headers().get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
}
