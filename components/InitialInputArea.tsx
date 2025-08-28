// 导入React类型和键盘事件类型
import { FC, KeyboardEvent } from "react";
// 导入打字动画组件
import TypeAnimation from "./TypeAnimation";
// 导入Next.js图片组件
import Image from "next/image";

// 初始输入区域组件的Props类型定义
type TInputAreaProps = {
  promptValue: string; // 当前输入框的值
  setPromptValue: React.Dispatch<React.SetStateAction<string>>; // 设置输入框值的函数
  disabled?: boolean; // 是否禁用输入（可选）
  handleChat: (messages?: { role: string; content: string }[]) => void; // 处理聊天的函数
  ageGroup: string; // 当前选择的教育水平
  setAgeGroup: React.Dispatch<React.SetStateAction<string>>; // 设置教育水平的函数
  handleInitialChat: () => void; // 处理初始聊天的函数
};

/**
 * InitialInputArea组件 - 首次输入区域组件
 * 提供学习主题输入框、教育水平选择器和搜索按钮
 * 支持键盘快捷键（Enter提交，Shift+Enter换行）
 */
const InitialInputArea: FC<TInputAreaProps> = ({
  promptValue,
  setPromptValue,
  disabled,
  handleInitialChat,
  ageGroup,
  setAgeGroup,
}) => {
  /**
   * 处理键盘事件的函数
   * Enter键：提交表单开始学习
   * Shift+Enter：允许换行输入
   * 
   * @param e - 键盘事件对象
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        return; // Shift+Enter：允许换行
      } else {
        e.preventDefault(); // 阻止默认换行行为
        handleInitialChat(); // 提交表单
      }
    }
  };

  return (
    <form
      className="mx-auto flex w-full flex-col items-center justify-between gap-4 sm:flex-row sm:gap-0"
      onSubmit={(e) => {
        e.preventDefault();
        handleInitialChat();
      }}
    >
      <div className="flex w-full rounded-lg border">
        <textarea
          placeholder="Teach me about..."
          className="block w-full resize-none rounded-l-lg border-r p-6 text-sm text-gray-900 placeholder:text-gray-400 sm:text-base"
          disabled={disabled}
          value={promptValue}
          required
          onKeyDown={handleKeyDown}
          onChange={(e) => setPromptValue(e.target.value)}
          rows={1}
        />
        <div className="flex items-center justify-center">
          <select
            id="grade"
            name="grade"
            className="ring-none h-full rounded-md rounded-r-lg border-0 bg-transparent px-2 text-sm font-medium text-black focus:ring-0 sm:text-base"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
          >
            <option>Elementary School</option>
            <option>Middle School</option>
            <option>High School</option>
            <option>College</option>
            <option>Undergrad</option>
            <option>Graduate</option>
          </select>
        </div>
      </div>
      <button
        disabled={disabled}
        type="submit"
        className="relative flex size-[72px] w-[358px] shrink-0 items-center justify-center rounded-md bg-[linear-gradient(154deg,#2A8EF9_23.37%,#175CB6_91.91%)] disabled:pointer-events-none disabled:opacity-75 sm:ml-3 sm:w-[72px]"
      >
        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center">
            <TypeAnimation />
          </div>
        )}

        <Image
          unoptimized
          src={"/up-arrow.svg"}
          alt="search"
          width={24}
          height={24}
          className={disabled ? "invisible" : ""}
        />
        <span className="ml-2 font-bold text-white sm:hidden">Search</span>
      </button>
    </form>
  );
};

export default InitialInputArea;
