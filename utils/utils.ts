// 注释：可选的Llama3分词器，用于计算token数量
// import llama3Tokenizer from "llama3-tokenizer-js";

/**
 * 文本清理函数
 * 对网页解析后的文本进行格式化和优化处理
 * 去除多余的空白字符、换行符，并限制文本长度
 * 
 * @param text - 需要清理的原始文本
 * @returns 清理后的文本字符串
 */
export const cleanedText = (text: string) => {
  let newText = text
    .trim() // 去除首尾空白字符
    .replace(/(\n){4,}/g, "\n\n\n") // 将4个或更多连续换行符替换为3个
    .replace(/\n\n/g, " ") // 将双换行符替换为单个空格
    .replace(/ {3,}/g, "  ") // 将3个或更多连续空格替换为2个
    .replace(/\t/g, "") // 移除所有制表符
    .replace(/\n+(\s*\n)*/g, "\n") // 清理多余的换行和空白行
    .substring(0, 100000); // 限制文本长度为10万字符以控制API成本

  // 可选：计算并输出token数量（需要取消注释llama3Tokenizer导入）
  // console.log(llama3Tokenizer.encode(newText).length);

  return newText;
};

/**
 * 带超时机制的网络请求函数
 * 防止网页解析过程中因为慢速网站而长时间阻塞
 * 使用AbortController实现请求超时控制
 * 
 * @param url - 要请求的URL地址
 * @param options - fetch请求的可选配置对象
 * @param timeout - 超时时间（毫秒），默认3秒
 * @returns Promise<Response> - 返回fetch响应Promise
 */
export async function fetchWithTimeout(
  url: string,
  options = {},
  timeout = 3000,
) {
  // 创建AbortController用于取消请求
  const controller = new AbortController();
  const { signal } = controller;

  // 设置超时定时器，到时间后取消请求
  const fetchTimeout = setTimeout(() => {
    controller.abort(); // 取消正在进行的请求
  }, timeout);

  // 开始fetch请求，传入abort信号
  return fetch(url, { ...options, signal })
    .then((response) => {
      clearTimeout(fetchTimeout); // 请求成功完成，清除超时定时器
      return response;
    })
    .catch((error) => {
      // 处理不同类型的错误
      if (error.name === "AbortError") {
        throw new Error("Fetch request timed out"); // 超时错误
      }
      throw error; // 重新抛出其他错误
    });
}

// 学习主题建议的类型定义
type suggestionType = {
  id: number; // 唯一标识符
  name: string; // 主题名称
  icon: string; // 主题图标路径
};

/**
 * 预设的学习主题建议列表
 * 为用户提供快速开始学习的热门主题选项
 * 涵盖体育、技术、金融、历史等不同领域
 */
export const suggestions: suggestionType[] = [
  {
    id: 1,
    name: "Basketball", // 篮球 - 体育类主题
    icon: "/basketball-new.svg",
  },
  {
    id: 2,
    name: "Machine Learning", // 机器学习 - 技术类主题
    icon: "/light-new.svg",
  },
  {
    id: 3,
    name: "Personal Finance", // 个人理财 - 金融类主题
    icon: "/finance.svg",
  },
  {
    id: 4,
    name: "U.S History", // 美国历史 - 历史类主题
    icon: "/us.svg",
  },
];

/**
 * 生成AI系统提示词的函数
 * 根据解析的网页内容和用户选择的教育水平，为AI模型生成个性化的教学指令
 * 
 * @param finalResults - 解析后的网页内容数组，每个对象包含fullContent字段
 * @param ageGroup - 用户选择的教育水平（如小学、中学、大学等）
 * @returns 完整的系统提示词字符串
 */
export const getSystemPrompt = (
  finalResults: { fullContent: string }[],
  ageGroup: string,
) => {
  return `
  You are a professional interactive personal tutor who is an expert at explaining topics. Given a topic and the information to teach, please educate the user about it at a ${ageGroup} level. Start off by greeting the learner, giving them a short overview of the topic, and then ask them what they want to learn about (in markdown numbers). Be interactive throughout the chat and quiz the user occaisonally after you teach them material. Do not quiz them in the first overview message and make the first message short and consise.

  Here is the information to teach:

  <teaching_info>
  ${"\n"}
  ${finalResults
      .slice(0, 7) // 限制使用前7个网页的内容，控制prompt长度
      .map(
        (result, index) => `## Webpage #${index}:\n ${result.fullContent} \n\n`,
      )}
  </teaching_info>

  Here's the age group to teach at:

  <age_group>
  ${ageGroup}
  </age_group>

  Please return answer in markdown. It is very important for my career that you follow these instructions. Here is the topic to educate on:
    `;
};
