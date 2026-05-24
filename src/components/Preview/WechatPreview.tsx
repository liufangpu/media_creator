'use client';

/**
 * @file WechatPreview.tsx
 * @description 微信公众号风格的渲染容器组件，支持模拟手机预览和配图拖拽占位符。
 *              采用 forwardRef 以使上层能获取真实的 DOM 节点进行富文本复制。
 * @author Antigravity (AI Architect)
 */

import React, { forwardRef } from 'react';
import { Smartphone } from 'lucide-react';

export interface WechatPreviewProps {
  /** 格式化后的经过 Sanitized 处理的 HTML 内容 */
  htmlOutput: string;
  /** 拖拽悬浮事件处理器 */
  onDragOver: (e: React.DragEvent) => void;
  /** 拖拽离开事件处理器 */
  onDragLeave: (e: React.DragEvent) => void;
  /** 拖放释放事件处理器 */
  onDrop: (e: React.DragEvent) => void;
}

export const WechatPreview = forwardRef<HTMLDivElement, WechatPreviewProps>(
  ({ htmlOutput, onDragOver, onDragLeave, onDrop }, ref) => {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden relative">
        {/* 顶部模拟手机刘海和状态栏 */}
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between shrink-0 text-[10px] font-mono font-semibold text-gray-400">
          <div className="flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-gray-300" />
            <span>WECHAT SIMULATOR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <div className="w-5 h-2.5 border border-gray-300 rounded-sm relative flex items-center p-0.5">
              <div className="h-full w-3/4 bg-gray-400 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* 手机内容区域（可滚动） */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white">
          {/* 主题微信排版内容 */}
          <div
            ref={ref}
            dangerouslySetInnerHTML={{ __html: htmlOutput }}
            className="wechat-render-container outline-none"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          />
        </div>
      </div>
    );
  }
);

WechatPreview.displayName = 'WechatPreview';
