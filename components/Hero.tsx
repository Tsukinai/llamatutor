// 导入Next.js图片组件
import Image from "next/image";
// 导入React函数组件类型
import { FC } from "react";
// 导入应用截图图片
import desktopImg from "../public/desktop-screenshot.png";
import mobileImg from "../public/screenshot-mobile.png";
// 导入初始输入区域组件
import InitialInputArea from "./InitialInputArea";
// 导入预设的学习主题建议
import { suggestions } from "@/utils/utils";

// Hero组件的Props类型定义
type THeroProps = {
  promptValue: string; // 当前输入框的值
  setPromptValue: React.Dispatch<React.SetStateAction<string>>; // 设置输入框值的函数
  handleChat: (messages?: { role: string; content: string }[]) => void; // 处理聊天的函数
  ageGroup: string; // 当前选择的教育水平
  setAgeGroup: React.Dispatch<React.SetStateAction<string>>; // 设置教育水平的函数
  handleInitialChat: () => void; // 处理初始聊天的函数
};

/**
 * Hero组件 - 应用首页的主要展示组件
 * 包含应用介绍、输入区域、主题建议卡片和应用截图
 * 为用户提供直观的应用功能介绍和快速开始的入口
 */
const Hero: FC<THeroProps> = ({
  promptValue,
  setPromptValue,
  handleChat,
  ageGroup,
  setAgeGroup,
  handleInitialChat,
}) => {
  /**
   * 处理主题建议卡片点击事件
   * 当用户点击预设的学习主题时，自动填充到输入框
   * 
   * @param value - 被点击的建议主题文本
   */
  const handleClickSuggestion = (value: string) => {
    setPromptValue(value);
  };

  return (
    <>
      {/* 主要内容区域：居中布局，包含标题、描述和输入区域 */}
      <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-center sm:mt-36">
        {/* 技术标签：显示AI技术提供商信息 */}
        <a
          className="mb-4 inline-flex h-7 shrink-0 items-center gap-[9px] rounded-[50px] border-[0.5px] border-solid border-[#E6E6E6] bg-[rgba(234,238,255,0.65)] bg-white px-5 py-4 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)]"
          href="https://togetherai.link/"
          target="_blank"
        >
          {/* Together AI公司logo */}
          <Image
            unoptimized
            src="/togethercomputer.png"
            alt="hero"
            width={20}
            height={20}
          />
          <span className="text-center text-sm font-medium italic">
            Powered by <b>Llama 3.1</b> and <b>Together AI</b>
          </span>
        </a>

        {/* 主标题：应用名称和核心价值主张 */}
        <h2 className="mt-2 bg-custom-gradient bg-clip-text text-center text-4xl font-medium tracking-tight text-gray-900 sm:text-6xl">
          Your Personal{" "}
          <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text font-bold text-transparent">
            Tutor
          </span>
        </h2>

        {/* 应用功能描述 */}
        <p className="mt-4 text-balance text-center text-sm sm:text-base">
          Enter a topic you want to learn about along with the education level
          you want to be taught at and generate a personalized tutor tailored to
          you!
        </p>

        {/* 输入区域：包含学习主题输入框和教育水平选择器 */}
        <div className="mt-4 w-full pb-6">
          <InitialInputArea
            promptValue={promptValue}
            handleInitialChat={handleInitialChat}
            setPromptValue={setPromptValue}
            handleChat={handleChat}
            ageGroup={ageGroup}
            setAgeGroup={setAgeGroup}
          />
        </div>

        {/* 主题建议卡片区域：预设的学习主题快速选择 */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pb-[30px] lg:flex-nowrap lg:justify-normal">
          {suggestions.map((item) => (
            <div
              className="flex h-[35px] cursor-pointer items-center justify-center gap-[5px] rounded border border-solid border-[#C1C1C1] px-2.5 py-2 transition hover:bg-gray-200"
              onClick={() => handleClickSuggestion(item?.name)}
              key={item.id}
            >
              {/* 主题图标 */}
              <Image
                src={item.icon}
                alt={item.name}
                width={18}
                height={16}
                className="w-[18px]"
              />
              {/* 主题名称 */}
              <span className="text-sm font-light leading-[normal] text-[#1B1B16]">
                {item.name}
              </span>
            </div>
          ))}
        </div>

        {/* 开源声明和GitHub链接 */}
        <p className="text-center text-sm font-light leading-[normal] text-[#1B1B16]">
          Fully open source!{" "}
          <span className="text-sm font-medium underline">
            <a
              href="https://github.com/Nutlope/llamatutor"
              target="_blank"
              rel="noopener noreferrer"
            >
              Star it on github.
            </a>
          </span>
        </p>
      </div>
      {/* 应用截图展示区域：展示应用在不同设备上的界面 */}
      <div className="mx-auto max-w-7xl">
        {/* 桌面版应用截图：在大屏幕上显示 */}
        <Image
          src={desktopImg}
          alt="hero"
          className="my-32 max-w-full max-lg:hidden"
        />
        {/* 移动版应用截图：在小屏幕上显示 */}
        <Image
          src={mobileImg}
          alt="hero"
          className="my-5 max-w-full lg:hidden"
        />
      </div>
    </>
  );
};

export default Hero;
