// 导入Next.js图片组件
import Image from "next/image";

/**
 * Sources组件 - 信息源展示组件
 * 显示搜索到的网页信息源列表，用户可以查看AI学习所依据的资料来源
 * 支持加载状态显示和响应式布局
 * 
 * @param sources - 信息源数组，包含网页标题和URL
 * @param isLoading - 是否正在加载信息源
 */
export default function Sources({
  sources,
  isLoading,
}: {
  sources: { name: string; url: string }[];
  isLoading: boolean;
}) {
  return (
    <div className="bg-white max-lg:-order-1 lg:flex lg:w-full lg:max-w-[300px] lg:flex-col">
      {/* 信息源标题 */}
      <div className="flex items-start gap-4 pb-3 lg:pb-3.5">
        <h3 className="text-base font-bold uppercase leading-[152.5%] text-black">
          sources:{" "}
        </h3>
      </div>

      {/* 信息源列表容器：支持水平滚动(移动端)和垂直滚动(桌面端) */}
      <div className="flex w-full items-center gap-6 pb-4 max-lg:overflow-x-scroll lg:grow lg:flex-col lg:gap-4 lg:overflow-y-scroll lg:pb-0">
        {isLoading ? (
          // 加载状态：显示骨架屏动画
          <>
            <div className="h-20 w-[260px] max-w-sm animate-pulse rounded-md bg-gray-300" />
            <div className="h-20 w-[260px] max-w-sm animate-pulse rounded-md bg-gray-300" />
            {/* 在不同屏幕尺寸下显示不同数量的骨架屏 */}
            <div className="hidden h-20 w-[260px] max-w-sm animate-pulse rounded-md bg-gray-300 sm:block" />
            <div className="hidden h-20 w-[260px] max-w-sm animate-pulse rounded-md bg-gray-300 sm:block" />
            <div className="hidden h-20 w-[260px] max-w-sm animate-pulse rounded-md bg-gray-300 lg:block" />
            <div className="hidden h-20 w-[260px] max-w-sm animate-pulse rounded-md bg-gray-300 lg:block" />
            <div className="hidden h-20 w-[260px] max-w-sm animate-pulse rounded-md bg-gray-300 lg:block" />
            <div className="hidden h-20 w-[260px] max-w-sm animate-pulse rounded-md bg-gray-300 lg:block" />
            <div className="hidden h-20 w-[260px] max-w-sm animate-pulse rounded-md bg-gray-300 lg:block" />
          </>
        ) : sources.length > 0 ? (
          // 有信息源时：渲染信息源卡片列表
          sources.map((source) => (
            <SourceCard source={source} key={source.url} />
          ))
        ) : (
          // 无信息源时：显示错误提示
          <div>Could not fetch sources.</div>
        )}
      </div>
    </div>
  );
}

/**
 * SourceCard组件 - 单个信息源卡片
 * 显示单个网页信息源的详细信息，包括网站图标、标题和链接
 * 
 * @param source - 信息源对象，包含名称和URL
 */
const SourceCard = ({ source }: { source: { name: string; url: string } }) => {
  return (
    <div className="flex h-[79px] w-full items-center gap-2.5 rounded-lg border border-gray-100 px-1.5 py-1 shadow-md">
      {/* 网站图标区域 */}
      <div className="shrink-0">
        <Image
          unoptimized // 禁用Next.js图片优化，因为是外部图标
          src={`https://www.google.com/s2/favicons?domain=${source.url}&sz=128`} // 使用Google Favicon服务获取网站图标
          alt={source.url}
          className="rounded-full p-1"
          width={36}
          height={36}
        />
      </div>

      {/* 网站信息区域 */}
      <div className="flex min-w-0 max-w-[192px] flex-col justify-center gap-1">
        {/* 网页标题：最多显示2行，超出时显示省略号 */}
        <h6 className="line-clamp-2 text-xs font-light">{source.name}</h6>
        {/* 网页链接：可点击访问，超出宽度时截断显示 */}
        <a
          target="_blank" // 在新标签页打开
          rel="noopener noreferrer" // 安全性属性
          href={source.url}
          className="truncate text-xs font-light text-[#1B1B16]/30"
        >
          {source.url}
        </a>
      </div>
    </div>
  );
};
