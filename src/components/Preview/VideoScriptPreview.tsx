'use client';

/**
 * @file VideoScriptPreview.tsx
 * @description 短视频分镜脚本渲染组件，专为表格展示设计宽视口，
 *              使用 forwardRef 暴露真正的富文本区域用于一键复制。
 * @author Antigravity (AI Architect)
 */

import React, { forwardRef } from 'react';
import { Film } from 'lucide-react';

export interface VideoScriptPreviewProps {
  /** 格式化后的脚本 HTML (包含表格) */
  htmlOutput: string;
}

export const VideoScriptPreview = forwardRef<HTMLDivElement, VideoScriptPreviewProps>(
  ({ htmlOutput }, ref) => {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden relative">
        {/* 顶部模拟状态栏 */}
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between shrink-0 text-[10px] font-mono font-semibold text-gray-400">
          <div className="flex items-center gap-1">
            <Film className="w-3.5 h-3.5 text-gray-300" />
            <span>VIDEO SCRIPT SIMULATOR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100 font-sans text-[8px] font-bold">
              宽屏预览
            </span>
          </div>
        </div>

        {/* 表格内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
          <div
            ref={ref}
            dangerouslySetInnerHTML={{ __html: htmlOutput }}
            className="video-script-render-container outline-none"
          />
        </div>
      </div>
    );
  }
);

VideoScriptPreview.displayName = 'VideoScriptPreview';
