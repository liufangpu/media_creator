'use client';

/**
 * @file XiaohongshuPreview.tsx
 * @description 小红书仿真卡片渲染组件，展示头像、关注、轮播封面图、正文、点赞等交互，
 *              使用 forwardRef 暴露真正的富文本区域用于一键复制。
 * @author Antigravity (AI Architect)
 */

import React, { forwardRef } from 'react';
import { Sparkles } from 'lucide-react';
import { SuggestedImage } from '@/types';

export interface XiaohongshuPreviewProps {
  /** 小红书格式化 HTML */
  htmlOutput: string;
  /** 智能配图组数组 */
  suggestedImages: SuggestedImage[];
  /** 拖拽已放置的图片地址映射 */
  placedImages: Record<string, string>;
  /** 拖拽事件回调 */
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const XiaohongshuPreview = forwardRef<HTMLDivElement, XiaohongshuPreviewProps>(
  ({ htmlOutput, suggestedImages, placedImages, onDragOver, onDragLeave, onDrop }, ref) => {
    // 封面图判定逻辑：如果放置了首图，用放置的，否则如果有智能配图，用第一张图的第一选项，否则空
    const coverUrl =
      placedImages['xiaohongshu_cover'] ||
      (suggestedImages.length > 0 && suggestedImages[0]?.options?.[0]?.url) ||
      '';

    return (
      <div className="flex flex-col h-full bg-white relative pb-14 overflow-hidden">
        {/* 顶部模拟用户信息栏 */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 shrink-0 z-10 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border border-gray-100 p-0.5 overflow-hidden bg-gradient-to-tr from-amber-400 to-rose-500 shrink-0">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-800 leading-tight">
                AI排版主编
              </span>
              <span className="text-[9px] text-gray-400">小红书官方认证主编</span>
            </div>
          </div>
          <button className="border border-[#ff2442] hover:bg-[#ff2442]/5 text-[#ff2442] px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wide active:scale-95 transition-all duration-200 cursor-pointer">
            关注
          </button>
        </div>

        {/* 主滚动物料区 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {/* 小红书首图/卡片区 */}
          <div
            className="w-full aspect-[3/4] bg-gray-50 relative group flex items-center justify-center overflow-hidden border-b border-gray-100 shrink-0 image-dropzone transition-all duration-300"
            data-id="xiaohongshu_cover"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt="cover"
                className="w-full h-full object-cover pointer-events-none transition-transform duration-500 hover:scale-105"
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center pointer-events-none p-6 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 border border-gray-100">
                  <Sparkles className="w-6 h-6 text-gray-300 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-gray-700">
                  小红书首图区
                </span>
                <span className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                  请从右侧配图画廊<br />
                  拖拽图片到此区域放置
                </span>
              </div>
            )}
            
            {suggestedImages.length > 0 && (
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full shadow-sm">
                1/{suggestedImages.length}
              </div>
            )}
          </div>

          {/* 正文内容展示区（实际复制的数据） */}
          <div className="px-5 py-4">
            <div
              ref={ref}
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
              className="xiaohongshu-render-container outline-none"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
            <div className="text-[10px] text-gray-400 mt-8 pb-6 font-mono">
              发布于 今天 12:00 · 创作助手由 AI 强力驱动
            </div>
          </div>
        </div>

        {/* 底部仿小红书互动组件 (绝对定位悬浮) */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center px-4 justify-between z-10 shrink-0 shadow-lg shadow-black/5">
          <div className="flex items-center gap-3 w-2/5">
            <div className="bg-gray-50 border border-gray-200/80 rounded-full px-3 py-1.5 text-xs text-gray-400 w-full font-medium">
              说点什么...
            </div>
          </div>
          <div className="flex items-center gap-5 text-gray-600 font-bold shrink-0">
            <div className="flex items-center gap-1 cursor-pointer active:scale-90 transition-transform">
              <span className="text-lg">🤍</span>
              <span className="text-[10px]">赞</span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer active:scale-90 transition-transform">
              <span className="text-lg">⭐</span>
              <span className="text-[10px]">收藏</span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer active:scale-90 transition-transform">
              <span className="text-lg">💬</span>
              <span className="text-[10px]">评论</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

XiaohongshuPreview.displayName = 'XiaohongshuPreview';
