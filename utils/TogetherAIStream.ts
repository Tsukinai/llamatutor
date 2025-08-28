// 导入事件源解析器相关类型和函数
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

// 聊天角色类型定义：用户或系统
export type ChatGPTAgent = "user" | "system";

// 聊天消息接口定义
export interface ChatGPTMessage {
  role: ChatGPTAgent; // 消息发送者角色
  content: string; // 消息内容
}

// Together AI流式请求负载接口定义
export interface TogetherAIStreamPayload {
  model: string; // 使用的AI模型名称
  messages: ChatGPTMessage[]; // 对话消息历史数组
  stream: boolean; // 是否启用流式响应
}

// 注释：原始Together客户端配置（已改为直接fetch调用）
// const together = new Together({
//   apiKey: process.env["TOGETHER_API_KEY"],
//   baseURL: "https://together.helicone.ai/v1",
//   defaultHeaders: {
//     "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
//   },
// });

/**
 * Together AI流式响应处理函数
 * 调用Together AI API并将响应转换为可读流
 * 通过Helicone代理进行请求监控和分析
 * 
 * @param payload - Together AI API请求负载
 * @returns ReadableStream - 可读流，用于流式输出AI回复
 */
export async function TogetherAIStream(payload: TogetherAIStreamPayload) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await fetch("https://together.helicone.ai/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-AppName": "llamatutor",
      Authorization: `Bearer ${process.env.TOGETHER_API_KEY ?? ""}`,
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      // callback
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === "event") {
          const data = event.data;
          controller.enqueue(encoder.encode(data));
        }
      };

      // optimistic error handling
      if (res.status !== 200) {
        const data = {
          status: res.status,
          statusText: res.statusText,
          body: await res.text(),
        };
        console.log(
          `Error: recieved non-200 status code, ${JSON.stringify(data)}`,
        );
        controller.close();
        return;
      }

      // stream response (SSE) from OpenAI may be fragmented into multiple chunks
      // this ensures we properly read chunks and invoke an event for each SSE event stream
      const parser = createParser(onParse);
      // https://web.dev/streams/#asynchronous-iteration
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  let counter = 0;
  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const data = decoder.decode(chunk);
      // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
      if (data === "[DONE]") {
        controller.terminate();
        return;
      }
      try {
        const json = JSON.parse(data);
        const text = json.choices[0].delta?.content || "";
        if (counter < 2 && (text.match(/\n/) || []).length) {
          // this is a prefix character (i.e., "\n\n"), do nothing
          return;
        }
        // stream transformed JSON resposne as SSE
        const payload = { text: text };
        // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
        counter++;
      } catch (e) {
        // maybe parse error
        controller.error(e);
      }
    },
  });

  return readableStream.pipeThrough(transformStream);
}
