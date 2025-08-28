// 声明这是一个客户端组件，可以使用浏览器特有的功能如useState
"use client";

// 导入应用的各个UI组件
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Sources from "@/components/Sources";
// 导入React状态管理钩子
import { useState } from "react";
// 导入事件源解析器，用于处理AI流式响应
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";
// 导入生成系统提示词的工具函数
import { getSystemPrompt } from "@/utils/utils";
// 导入聊天界面组件
import Chat from "@/components/Chat";

/**
 * 主页面组件 - Llama Tutor应用的核心
 * 管理整个应用的状态，包括用户输入、AI对话、信息源获取等
 * 实现从学习主题输入到AI个性化教学的完整流程
 */
export default function Home() {
  // 用户输入的学习主题内容
  const [inputValue, setInputValue] = useState("");
  // 当前学习的主题名称
  const [topic, setTopic] = useState("");
  // 是否显示聊天结果界面（切换Hero页面和Chat页面）
  const [showResult, setShowResult] = useState(false);
  // 搜索到的信息源列表（网页标题和URL）
  const [sources, setSources] = useState<{ name: string; url: string }[]>([]);
  // 信息源加载状态
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  // 对话消息历史（包含系统提示、用户消息、AI回复）
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  // AI响应生成状态
  const [loading, setLoading] = useState(false);
  // 用户选择的教育水平/年龄组
  const [ageGroup, setAgeGroup] = useState("Middle School");

  /**
   * 处理初始聊天请求的函数
   * 当用户首次提交学习主题时调用
   * 负责启动整个学习流程：搜索信息源 -> 解析内容 -> 生成AI回复
   */
  const handleInitialChat = async () => {
    setShowResult(true); // 切换到聊天结果界面
    setLoading(true); // 开始加载状态
    setTopic(inputValue); // 保存当前学习主题
    setInputValue(""); // 清空输入框

    // 执行完整的信息获取和AI对话流程
    await handleSourcesAndChat(inputValue);

    setLoading(false); // 结束加载状态
  };

  /**
   * 处理与AI的对话交互
   * 发送消息到AI API并处理流式响应
   * 实现实时显示AI回复内容的效果
   * 
   * @param messages - 可选的消息历史数组
   */
  const handleChat = async (messages?: { role: string; content: string }[]) => {
    setLoading(true); // 开始AI响应生成

    // 向聊天API发送请求
    const chatRes = await fetch("/api/getChat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }), // 发送消息历史
    });

    if (!chatRes.ok) {
      throw new Error(chatRes.statusText);
    }

    // 获取流式响应数据
    const data = chatRes.body;
    if (!data) {
      return;
    }
    let fullAnswer = ""; // 用于收集完整的AI回复

    /**
     * 解析流式事件的回调函数
     * 处理每个接收到的文本片段
     */
    const onParse = (event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        const data = event.data;
        try {
          // 解析JSON数据并提取文本内容
          const text = JSON.parse(data).text ?? "";
          fullAnswer += text;

          // 实时更新消息列表，展示AI正在生成的内容
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            // 如果最后一条消息是AI回复，则追加新文本
            if (lastMessage.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + text },
              ];
            } else {
              // 如果最后一条不是AI回复，创建新的AI消息
              return [...prev, { role: "assistant", content: text }];
            }
          });
        } catch (e) {
          console.error(e);
        }
      }
    };

    // 使用ReadableStream API处理流式数据
    // 参考：https://web.dev/streams/#the-getreader-and-read-methods
    const reader = data.getReader();
    const decoder = new TextDecoder(); // 将字节转换为文本
    const parser = createParser(onParse); // 创建事件解析器
    let done = false;

    // 循环读取流数据直到完成
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value); // 解码当前数据块
      parser.feed(chunkValue); // 将数据喂给解析器
    }
    setLoading(false); // 结束AI响应生成
  };

  /**
   * 处理信息源获取和AI对话的完整流程
   * 这是应用的核心业务逻辑函数，包含三个主要步骤：
   * 1. 搜索相关网页信息源
   * 2. 解析网页内容提取文本
   * 3. 生成系统提示并启动AI对话
   * 
   * @param question - 用户的学习问题
   */
  async function handleSourcesAndChat(question: string) {
    // 第一步：搜索相关信息源
    setIsLoadingSources(true); // 开始信息源加载状态
    let sourcesResponse = await fetch("/api/getSources", {
      method: "POST",
      body: JSON.stringify({ question }), // 发送用户问题进行搜索
    });

    let sources;
    if (sourcesResponse.ok) {
      sources = await sourcesResponse.json(); // 获取搜索结果
      setSources(sources); // 更新信息源列表供UI显示
    } else {
      setSources([]); // 搜索失败时设置空数组
    }
    setIsLoadingSources(false); // 结束信息源加载状态

    // 第二步：解析网页内容
    const parsedSourcesRes = await fetch("/api/getParsedSources", {
      method: "POST",
      body: JSON.stringify({ sources }), // 发送搜索到的网页URL进行解析
    });

    let parsedSources;
    if (parsedSourcesRes.ok) {
      parsedSources = await parsedSourcesRes.json(); // 获取解析后的网页文本内容
    }

    // 第三步：构建AI对话
    // 创建初始消息数组：系统提示 + 用户问题
    const initialMessage = [
      {
        role: "system",
        content: getSystemPrompt(parsedSources, ageGroup) // 生成包含学习资料和教育水平的系统提示
      },
      {
        role: "user",
        content: `${question}` // 用户的原始学习问题
      },
    ];

    setMessages(initialMessage); // 设置初始消息历史
    await handleChat(initialMessage); // 启动AI对话
  }

  return (
    <>
      {/* 页面头部导航栏 */}
      <Header />

      {/* 主要内容区域 */}
      <main
        className={`flex grow flex-col px-4 pb-4 ${showResult ? "overflow-hidden" : ""}`}
      >
        {/* 根据showResult状态条件渲染不同的界面 */}
        {showResult ? (
          // 聊天结果界面：显示AI对话和信息源
          <div className="mt-2 flex w-full grow flex-col justify-between overflow-hidden">
            <div className="flex w-full grow flex-col space-y-2 overflow-hidden">
              <div className="mx-auto flex w-full max-w-7xl grow flex-col gap-4 overflow-hidden lg:flex-row lg:gap-10">
                {/* 左侧：聊天对话区域 */}
                <Chat
                  messages={messages} // 传递消息历史
                  disabled={loading} // 加载时禁用输入
                  promptValue={inputValue} // 当前输入值
                  setPromptValue={setInputValue} // 输入值更新函数
                  setMessages={setMessages} // 消息更新函数
                  handleChat={handleChat} // 处理聊天的函数
                  topic={topic} // 当前学习主题
                />
                {/* 右侧：信息源展示区域 */}
                <Sources
                  sources={sources} // 搜索到的网页信息源
                  isLoading={isLoadingSources} // 信息源加载状态
                />
              </div>
            </div>
          </div>
        ) : (
          // 首页欢迎界面：显示应用介绍和初始输入
          <Hero
            promptValue={inputValue} // 当前输入值
            setPromptValue={setInputValue} // 输入值更新函数
            handleChat={handleChat} // 处理聊天的函数
            ageGroup={ageGroup} // 当前选择的教育水平
            setAgeGroup={setAgeGroup} // 教育水平更新函数
            handleInitialChat={handleInitialChat} // 处理初始聊天的函数
          />
        )}
      </main>
      {/* 页面底部（当前被注释掉） */}
      {/* <Footer /> */}
    </>
  );
}
