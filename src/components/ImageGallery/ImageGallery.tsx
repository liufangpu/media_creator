'use client';

/**
 * @file ImageGallery.tsx
 * @description 智能配图推荐与创作控制面板，支持针对每个图组进行个性化图库搜索与 AI 绘画生图。
 *              整合了子组件 ImageCard 并提供优雅的交互和动画过渡。
 * @author Antigravity (AI Architect)
 */

import React from 'react';
import { Image, Search, Wand2, RefreshCw } from 'lucide-react';
import { ImageCard } from './ImageCard';
import { Button } from '@/components/ui/Button';
import { SuggestedImage } from '@/types';

export interface ImageGalleryProps {
  /** 智能配图数据列表 */
  suggestedImages: SuggestedImage[];
  /** 各配图组自定义输入的检索词映射表 */
  customKeywords: Record<string, string>;
  /** 检索词变化时的回调方法 */
  onKeywordChange: (groupId: string, keyword: string) => void;
  /** 检索/生图状态映射 */
  isSearchingImage: Record<string, 'search' | 'generate' | null>;
  /** 执行图库检索的回调方法 */
  onSearchImage: (groupId: string, keyword: string) => void;
  /** 执行 AI 绘画生图的回调方法 */
  onGenerateImage: (groupId: string, keyword: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  suggestedImages,
  customKeywords,
  onKeywordChange,
  isSearchingImage,
  onSearchImage,
  onGenerateImage,
}) => {
  if (suggestedImages.length === 0) return null;

  return (
    <div className="w-1/6 bg-white flex flex-col min-w-[280px] border-l border-gray-200 h-full animate-in slide-in-from-right fade-in duration-300">
      {/* 顶部标题栏 */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <h3 className="font-bold text-gray-800 flex items-center gap-1.5 text-sm">
          <Image className="w-4 h-4 text-blue-600 shrink-0" />
          <span>智能配图推荐</span>
        </h3>
        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
          按住右侧心仪配图，拖拽至左侧公众号占位区即可替换完成。
        </p>
      </div>

      {/* 图片组展示列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {suggestedImages.map((group) => {
          const searchStatus = isSearchingImage[group.id];
          const isBusy = searchStatus !== null && searchStatus !== undefined;
          const currentKeyword = customKeywords[group.id] || '';

          return (
            <div
              key={group.id}
              className="space-y-3 pb-6 border-b border-gray-100 last:border-0 last:pb-0"
            >
              {/* 配图组头部标签 */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                  图 {group.id} 占位区备选
                </span>
                <span className="text-[10px] text-gray-400 font-mono truncate max-w-[50%]">
                  AI原词: &quot;{group.keyword}&quot;
                </span>
              </div>

              {/* 自定义配图搜图与 AI 生图操作卡片 */}
              <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-200/50 space-y-2">
                <input
                  type="text"
                  placeholder="不喜欢？描述全新画面以搜图或生图"
                  className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all placeholder-gray-400 font-medium"
                  value={currentKeyword}
                  onChange={(e) => onKeywordChange(group.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isBusy) {
                      onSearchImage(group.id, currentKeyword);
                    }
                  }}
                />
                
                <div className="flex gap-2">
                  {/* 1. 图库搜索按钮 */}
                  <Button
                    onClick={() => onSearchImage(group.id, currentKeyword)}
                    disabled={isBusy || !currentKeyword.trim()}
                    isLoading={searchStatus === 'search'}
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-[10px] py-1 bg-white cursor-pointer"
                    leftIcon={searchStatus !== 'search' && <Search className="w-3 h-3" />}
                  >
                    搜图库
                  </Button>
                  
                  {/* 2. AI 绘画生图按钮 */}
                  <Button
                    onClick={() => onGenerateImage(group.id, currentKeyword)}
                    disabled={isBusy || !currentKeyword.trim()}
                    isLoading={searchStatus === 'generate'}
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-[10px] py-1 bg-purple-50 text-purple-700 hover:bg-purple-100/80 hover:text-purple-800 cursor-pointer"
                    leftIcon={searchStatus !== 'generate' && <Wand2 className="w-3 h-3 text-purple-500" />}
                    title="调用快手可灵大模型，根据你的描述画一张专属图片"
                  >
                    AI生图
                  </Button>
                </div>
              </div>

              {/* 备选配图网格列表 */}
              <div className="grid gap-3 pt-1">
                {group.options && group.options.length > 0 ? (
                  group.options.map((img, idx) => (
                    <ImageCard key={img.id} image={img} index={idx} />
                  ))
                ) : (
                  <div className="text-[10px] text-gray-400 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    暂无图片备选，请在上方输入关键词检索
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
