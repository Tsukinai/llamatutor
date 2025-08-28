// 导入React Markdown组件，用于渲染AI回复的Markdown格式文本
import ReactMarkdown from "react-markdown";
// 导入后续对话的输入区域组件
import FinalInputArea from "./FinalInputArea";
// 导入React钩子函数
import { useEffect, useRef, useState } from "react";
// 导入应用logo图标
import simpleLogo from "../public/simple-logo.png";
// 导入Next.js图片组件
import Image from "next/image";

/**
 * Chat组件 - AI对话界面的核心组件
 * 负责显示对话历史、处理消息滚动、提供后续输入功能
 * 包含智能滚动控制和实时消息更新功能
 * 
 * @param messages - 对话消息历史数组
 * @param disabled - 是否禁用输入（AI正在生成回复时）
 * @param promptValue - 当前输入框的值
 * @param setPromptValue - 设置输入框值的函数
 * @param setMessages - 更新消息历史的函数
 * @param handleChat - 处理发送消息的函数
 * @param topic - 当前学习主题
 */
export default function Chat({
  messages,
  disabled,
  promptValue,
  setPromptValue,
  setMessages,
  handleChat,
  topic,
}: {
  messages: { role: string; content: string }[];
  disabled: boolean;
  promptValue: string;
  setPromptValue: React.Dispatch<React.SetStateAction<string>>;
  setMessages: React.Dispatch<
    React.SetStateAction<{ role: string; content: string }[]>
  >;
  handleChat: () => void;
  topic: string;
}) {
  // 消息列表底部的引用，用于自动滚动到最新消息
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 可滚动容器的引用，用于检测用户滚动行为
  const scrollableContainerRef = useRef<HTMLDivElement>(null);
  // 跟踪用户是否已滚动到底部（决定是否自动滚动）
  const [didScrollToBottom, setDidScrollToBottom] = useState(true);

  /**
   * 滚动到消息列表底部的函数
   * 用于在新消息到达时自动显示最新内容
   */
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }

  // 当消息更新且用户在底部时，自动滚动到最新消息
  useEffect(() => {
    if (didScrollToBottom) {
      scrollToBottom();
    }
  }, [didScrollToBottom, messages]);

  // 设置滚动事件监听器，检测用户是否手动滚动离开底部
  useEffect(() => {
    let el = scrollableContainerRef.current;
    if (!el) {
      return;
    }

    /**
     * 处理滚动事件的函数
     * 检测用户是否滚动到底部，以决定是否继续自动滚动
     */
    function handleScroll() {
      if (scrollableContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          scrollableContainerRef.current;
        // 如果滚动位置接近底部（允许小误差），认为用户在底部
        setDidScrollToBottom(scrollTop + clientHeight >= scrollHeight);
      }
    }

    // 添加滚动事件监听器
    el.addEventListener("scroll", handleScroll);

    // 清理函数：移除事件监听器
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="flex grow flex-col gap-4 overflow-hidden">
      {/* 聊天消息显示区域 */}
      <div className="flex grow flex-col overflow-hidden lg:p-4">
        {/* 当前学习主题显示 */}
        <p className="uppercase text-gray-900">
          <b>Topic: </b>
          {topic}
        </p>

        {/* 消息滚动容器 */}
        <div
          ref={scrollableContainerRef}
          className="mt-2 overflow-y-scroll rounded-lg border border-solid border-[#C2C2C2] bg-white px-5 lg:p-7"
        >
          {/* 根据消息数量条件渲染内容 */}
          {messages.length > 2 ? (
            // 有实际对话内容时：显示消息历史（跳过前2条系统消息）
            <div className="prose-sm max-w-5xl lg:prose lg:max-w-full">
              {messages.slice(2).map((message, index) =>
                message.role === "assistant" ? (
                  // AI助手消息：带logo的Markdown渲染
                  <div className="relative w-full" key={index}>
                    {/* AI助手头像logo */}
                    <Image
                      src={simpleLogo}
                      alt=""
                      className="absolute left-0 top-0 !my-0 size-7"
                    />
                    {/* AI回复内容：支持Markdown格式 */}
                    <ReactMarkdown className="w-full pl-10">
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  // 用户消息：右对齐的蓝色气泡
                  <p
                    key={index}
                    className="ml-auto w-fit rounded-xl bg-blue-500 p-4 font-medium text-white"
                  >
                    {message.content}
                  </p>
                ),
              )}
              {/* 消息列表底部标记，用于自动滚动定位 */}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            // 无对话内容时：显示加载动画占位符
            <div className="flex w-full flex-col gap-4 py-5">
              {Array.from(Array(10).keys()).map((i) => (
                <div
                  key={i}
                  className={`${i < 5 && "hidden sm:block"} h-10 animate-pulse rounded-md bg-gray-300`}
                  style={{ animationDelay: `${i * 0.05}s` }} // 错开动画时间，创造波浪效果
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 后续对话输入区域 */}
      <div className="bg-white lg:p-4">
        <FinalInputArea
          disabled={disabled} // AI生成时禁用输入
          promptValue={promptValue} // 当前输入值
          setPromptValue={setPromptValue} // 输入值更新函数
          handleChat={handleChat} // 发送消息处理函数
          messages={messages} // 消息历史
          setMessages={setMessages} // 消息更新函数
        />
      </div>
    </div>
  );
}
