'use client';

/**
 * @file Header.tsx
 * @description 顶部导航控制台组件，管理润色等级、微信风格选择，并触发全局多平台一键排版任务。
 *              整合了自定义的 UI 基础组件 Select 和 Button。
 * @author Antigravity (AI Architect)
 */

import React from 'react';
import { Sparkles, PenTool, Palette, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PlatformType, PolishLevel, ThemeType } from '@/types';

export interface HeaderProps {
  /** 当前 AI 润色级别 */
  polishLevel: PolishLevel;
  /** 设置润色级别回调 */
  onPolishLevelChange: (level: PolishLevel) => void;
  /** 当前展示的目标平台 */
  platform: PlatformType;
  /** 微信公众号当前排版主题风格 */
  currentTheme: ThemeType;
  /** 设置排版风格回调 */
  onThemeChange: (theme: ThemeType) => void;
  /** 排版处理进行状态 */
  isProcessing: boolean;
  /** 触发排版生成动作 */
  onGenerate: () => void;
  /** 输入区是否包含文本内容（用于禁用按钮） */
  hasInput: boolean;
  /** 是否启用人性化去 AI 味处理 */
  humanize: boolean;
  /** 设置人性化开关回调 */
  onHumanizeChange: (value: boolean) => void;
  /** 当前选中的模板名称 */
  selectedTemplateName?: string;
  /** 点击打开模板选择器的回调 */
  onOpenTemplateSelector?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  polishLevel,
  onPolishLevelChange,
  platform,
  currentTheme,
  onThemeChange,
  isProcessing,
  onGenerate,
  hasInput,
  humanize,
  onHumanizeChange,
  selectedTemplateName,
  onOpenTemplateSelector,
}) => {
  // 润色选择下拉选项
  const polishOptions = [
    { value: 'none', label: '仅排版/转写 (原汁原味)' },
    { value: 'fix', label: '轻度润色 (修错字与语病)' },
    { value: 'rewrite', label: '深度重写 (仿写与逻辑重组)' },
  ];

  // 微信风格选择下拉选项
  const themeOptions = [
    { value: 'tech', label: '科技极简风 (Tech)' },
    { value: 'emotion', label: '文艺散文风 (Emotion)' },
    { value: 'news', label: '资讯快报风 (News)' },
    { value: 'vlog', label: '小红书/Vlog风 (Vlog)' },
  ];

  return (
    <header className="bg-white border-b border-gray-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      {/* 左侧 Logo */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm shadow-blue-100">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
        <h1 className="text-lg font-bold text-gray-800 tracking-tight">
          AI 跨平台内容工厂
        </h1>
        <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">
          PRO
        </span>
      </div>

      {/* 右侧控制选项和生成按钮 */}
      <div className="flex items-center gap-4">
        {/* 1. 主编风格定制 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            主编风格
          </span>
          <button
            onClick={onOpenTemplateSelector}
            className="inline-flex items-center justify-between gap-2 px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100/60 active:scale-98 border border-gray-200/80 text-xs font-bold rounded-xl text-gray-700 transition-all cursor-pointer"
            title="选择行业内置 Prompt 模板或定制你专属的创作风格"
          >
            <span>{selectedTemplateName || '🤖 系统通用排版'}</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          </button>
        </div>

        {/* 2. AI 润色级别选择 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            排版深度
          </span>
          <Select
            value={polishLevel}
            onChange={(e) => onPolishLevelChange(e.target.value as PolishLevel)}
            icon={<PenTool className="w-4 h-4 text-gray-400" />}
            options={polishOptions}
          />
        </div>

        {/* 3. 人性化去 AI 味开关 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            人性化
          </span>
          <button
            onClick={() => onHumanizeChange(!humanize)}
            disabled={isProcessing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
              humanize
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
            }`}
            title={humanize ? '已启用：生成后会进行去 AI 味改写' : '点击启用人性化去 AI 味后处理'}
          >
            <UserCheck className={`w-4 h-4 ${humanize ? 'text-amber-500' : 'text-gray-400'}`} />
            {humanize ? '去AI味 ✓' : '去AI味'}
          </button>
        </div>

        {/* 4. 微信风格定制（仅在微信平台激活时显示） */}
        {platform === 'wechat' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-300">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              视觉风格
            </span>
            <Select
              value={currentTheme}
              onChange={(e) => onThemeChange(e.target.value as ThemeType)}
              icon={<Palette className="w-4 h-4 text-gray-400" />}
              options={themeOptions}
            />
          </div>
        )}

        {/* 分割线 */}
        <div className="h-6 w-px bg-gray-200" />

        {/* 4. 一键生成主按钮 */}
        <Button
          onClick={onGenerate}
          isLoading={isProcessing}
          disabled={!hasInput}
          leftIcon={<Sparkles className="w-4 h-4" />}
          variant="primary"
          className="shadow-md hover:shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20"
        >
          {isProcessing ? '主编处理中...' : '一键生成多平台内容'}
        </Button>
      </div>
    </header>
  );
};
