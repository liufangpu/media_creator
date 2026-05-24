'use client';

/**
 * @file ImageCard.tsx
 * @description 单张图片卡片组件，支持拖拽源数据绑定，并浮现摄影师与来源信息。
 * @author Antigravity (AI Architect)
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { SuggestedImageOption } from '@/types';

export interface ImageCardProps {
  /** 单个配图选项的数据 */
  image: SuggestedImageOption;
  /** 可选的选项索引序号 */
  index?: number;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, index }) => {
  const handleDragStart = (e: React.DragEvent) => {
    // 绑定富文本或普通文本形式的图片 URL
    e.dataTransfer.setData('text/uri-list', image.url);
    e.dataTransfer.setData('text/plain', image.url);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  return (
    <div className="group relative rounded-xl overflow-hidden border border-gray-200/80 bg-gray-50/50 hover:border-blue-400 hover:shadow-lg transition-all duration-300">
      {/* 缩略图 - 支持拖拽 */}
      <img
        src={image.thumb || image.url}
        alt={`配图选项 ${index !== undefined ? index + 1 : ''}`}
        className="w-full h-28 object-cover cursor-grab active:cursor-grabbing hover:scale-102 transition-transform duration-300"
        title="按住并拖拽此图到左侧的文章配图预留区"
        draggable
        onDragStart={handleDragStart}
      />

      {/* 底部浮层 - Hover 触发显示署名和来源 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white text-[9px] p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-between items-center">
        <span className="truncate max-w-[70%] font-medium">
          摄影: {image.photographer || 'AI 生成'}
        </span>
        <a
          href={image.page_url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-300 hover:text-white transition-colors flex items-center gap-0.5 shrink-0"
        >
          <span>来源</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};
