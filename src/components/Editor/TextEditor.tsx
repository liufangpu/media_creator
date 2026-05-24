'use client';

/**
 * @file TextEditor.tsx
 * @description 左侧写作编辑/大纲输入区组件，支持字数统计及无缝对焦阴影效果。
 * @author Antigravity (AI Architect)
 */

import React from 'react';
import { PenTool } from 'lucide-react';

export interface TextEditorProps {
  /** 编辑器文本值 */
  value: string;
  /** 文本变化回调 */
  onChange: (text: string) => void;
  /** 文本框的占位描述文字 */
  placeholder?: string;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  placeholder = '例如：今天开了个会，讲了AI排版工具的想法，我觉得特别好，解决了大家不会排版的痛点，只需要粘贴文本，它就能自动提炼金句，甚至还能仿写润色。完全零干预，简直是神器...',
}) => {
  return (
    <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white h-full">
      {/* 顶部状态栏 */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-1.5 text-gray-600">
          <PenTool className="w-3.5 h-3.5 text-gray-400" />
          <span>请贴入脑暴草稿、录音转写或任意文本大纲</span>
        </div>
        <span className="font-mono text-gray-400 bg-white px-2 py-0.5 border border-gray-100 rounded-md shadow-sm">
          {value.length} 字
        </span>
      </div>

      {/* 文本输入区 */}
      <div className="flex-1 p-2 bg-white">
        <textarea
          className="w-full h-full p-4 resize-none outline-none text-gray-800 leading-relaxed text-sm bg-transparent placeholder-gray-400 transition-colors focus:bg-gray-50/30 rounded-xl"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};
