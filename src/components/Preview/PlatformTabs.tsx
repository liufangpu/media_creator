'use client';

/**
 * @file PlatformTabs.tsx
 * @description 平台切换 Tab 控制组件，包含微信公众号、小红书及短视频脚本的切换，
 *              支持平滑的 Hover 态与选中高亮视觉效果。
 * @author Antigravity (AI Architect)
 */

import React from 'react';
import { BookOpen, Smartphone, Video } from 'lucide-react';
import { PlatformType } from '@/types';

export interface PlatformTabsProps {
  /** 当前选中的平台类型 */
  activeTab: PlatformType;
  /** 平台切换回调方法 */
  onTabChange: (tab: PlatformType) => void;
}

export const PlatformTabs: React.FC<PlatformTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: 'wechat' as PlatformType,
      label: '微信公众号',
      desc: '图文并茂排版',
      icon: <BookOpen className="w-4 h-4" />,
      activeClass: 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/20',
      hoverClass: 'hover:text-blue-500 hover:bg-blue-50/5',
    },
    {
      id: 'xiaohongshu' as PlatformType,
      label: '小红书文案',
      desc: '爆款卡片仿真',
      icon: <Smartphone className="w-4 h-4" />,
      activeClass: 'text-rose-600 border-b-2 border-rose-600 bg-rose-50/20',
      hoverClass: 'hover:text-rose-500 hover:bg-rose-50/5',
    },
    {
      id: 'video_script' as PlatformType,
      label: '短视频脚本',
      desc: '多维口播分镜',
      icon: <Video className="w-4 h-4" />,
      activeClass: 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/20',
      hoverClass: 'hover:text-purple-500 hover:bg-purple-50/5',
    },
  ];

  return (
    <div className="flex border-b border-gray-200 bg-white shrink-0 shadow-sm">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3.5 px-4 text-xs font-semibold flex flex-col justify-center items-center gap-1 transition-all duration-300 relative group cursor-pointer ${
              isActive ? tab.activeClass : `text-gray-500 ${tab.hoverClass}`
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              {tab.icon}
              <span>{tab.label}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-normal group-hover:text-gray-500 transition-colors">
              {tab.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
};
