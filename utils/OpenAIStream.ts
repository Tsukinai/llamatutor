// 导入事件源解析器相关类型和函数
import {
    createParser,
    ParsedEvent,
    ReconnectInterval,
} from "eventsource-parser";

// 聊天角色类型定义：用户或系统
export type ChatGPTAgent = "user" | "system" | "assistant";

// 聊天消息接口定义
export interface ChatGPTMessage {
    role: ChatGPTAgent; // 消息发送者角色
    content: string; // 消息内容
}

// OpenAI流式请求负载接口定义
export interface OpenAIStreamPayload {
    model: string; // 使用的AI模型名称
    messages: ChatGPTMessage[]; // 对话消息历史数组
    stream: boolean; // 是否启用流式响应
    temperature?: number; // 可选：控制随机性
    max_tokens?: number; // 可选：最大token数
}

/**
 * OpenAI流式响应处理函数
 * 调用OpenAI API并将响应转换为可读流
 * 支持GPT-4、GPT-3.5-turbo等模型的流式对话
 * 
 * @param payload - OpenAI API请求负载
 * @returns ReadableStream - 可读流，用于流式输出AI回复
 */
export async function OpenAIStream(payload: OpenAIStreamPayload) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // 调用OpenAI API, 此处使用自己的api
    const res = await fetch("https://api.vveai.com/v1/chat/completions", {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`, // OpenAI API认证
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    const readableStream = new ReadableStream({
        async start(controller) {
            /**
             * 事件解析回调函数
             * 处理从OpenAI接收到的Server-Sent Events数据
             */
            const onParse = (event: ParsedEvent | ReconnectInterval) => {
                if (event.type === "event") {
                    const data = event.data;
                    controller.enqueue(encoder.encode(data));
                }
            };

            // 错误处理：检查API响应状态
            if (res.status !== 200) {
                const errorData = {
                    status: res.status,
                    statusText: res.statusText,
                    body: await res.text(),
                };
                console.log(
                    `OpenAI API Error: received non-200 status code, ${JSON.stringify(errorData)}`,
                );
                controller.close();
                return;
            }

            // 创建SSE解析器并处理流式数据
            // OpenAI的流式响应格式与Together AI类似，都使用SSE
            const parser = createParser(onParse);

            // 异步读取响应流的每个数据块
            // 参考：https://web.dev/streams/#asynchronous-iteration
            for await (const chunk of res.body as any) {
                parser.feed(decoder.decode(chunk));
            }
        },
    });

    let counter = 0;
    const transformStream = new TransformStream({
        async transform(chunk, controller) {
            const data = decoder.decode(chunk);

            // OpenAI流式响应结束标志
            if (data === "[DONE]") {
                controller.terminate();
                return;
            }

            try {
                const json = JSON.parse(data);
                // OpenAI响应格式：choices[0].delta.content
                const text = json.choices[0].delta?.content || "";

                // 过滤前几个可能的换行符（与原实现保持一致）
                if (counter < 2 && (text.match(/\n/) || []).length) {
                    // 跳过前缀字符（如 "\n\n"）
                    return;
                }

                // 将AI回复转换为统一的JSON格式，供前端使用
                const payload = { text: text };

                // 按照Server-Sent Events格式输出
                // 参考：https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
                );
                counter++;
            } catch (e) {
                // JSON解析错误处理
                console.error("OpenAI stream parsing error:", e);
                controller.error(e);
            }
        },
    });

    return readableStream.pipeThrough(transformStream);
}
