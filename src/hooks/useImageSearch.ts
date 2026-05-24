'use client';

/**
 * @file useImageSearch.ts
 * @description 封装配图推荐搜索 (Pexels) 与 AI 高清生图 (SiliconFlow Kolors) 逻辑的 Hook。
 * @author Antigravity (AI Architect)
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { SuggestedImageOption } from '@/types';

export interface UseImageSearchReturn {
  /** 各配图组当前输入的自定义关键词映射表 */
  customKeywords: Record<string, string>;
  /** 设置自定义关键词 */
  setCustomKeyword: (groupId: string, keyword: string) => void;
  /** 各配图组当前的搜索/生图加载状态映射表 */
  isSearchingImage: Record<string, 'search' | 'generate' | null>;
  /**
   * 触发图库搜索
   * @param groupId 配图组 ID
   * @param keyword 关键词
   * @param onUpdateOptions 成功后的回调，用于更新上层状态
   */
  searchImage: (
    groupId: string,
    keyword: string,
    onUpdateOptions: (options: SuggestedImageOption[]) => void
  ) => Promise<void>;
  /**
   * 触发 AI 绘画生图
   * @param groupId 配图组 ID
   * @param keyword 生图画面描述
   * @param onUpdateOptions 成功后的回调，添加新图片至列表
   */
  generateImage: (
    groupId: string,
    keyword: string,
    onUpdateOptions: (newOption: SuggestedImageOption) => void
  ) => Promise<void>;
}

export const useImageSearch = (): UseImageSearchReturn => {
  const [customKeywords, setCustomKeywords] = useState<Record<string, string>>({});
  const [isSearchingImage, setIsSearchingImage] = useState<Record<string, 'search' | 'generate' | null>>({});
  const toast = useToast();

  // 更新单个组的自定义关键词
  const setCustomKeyword = useCallback((groupId: string, keyword: string) => {
    setCustomKeywords((prev) => ({ ...prev, [groupId]: keyword }));
  }, []);

  // 1. 图库搜索方法
  const searchImage = useCallback(async (
    groupId: string,
    keyword: string,
    onUpdateOptions: (options: SuggestedImageOption[]) => void
  ) => {
    if (!keyword.trim()) {
      toast.error('请输入配图搜索关键词');
      return;
    }

    setIsSearchingImage((prev) => ({ ...prev, [groupId]: 'search' }));

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, type: 'search' }),
      });

      const contentType = res.headers.get('content-type');
      let data: any = null;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`服务器响应格式异常 (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data?.error || '图片搜索失败');
      }

      if (data.options && data.options.length > 0) {
        onUpdateOptions(data.options);
        toast.success(`图库搜索完成，已更新备选图 🎉`);
      } else {
        toast.info('未找到相关图片，换个关键词试试吧');
      }
    } catch (error: any) {
      console.error('Image Search Hook Error:', error);
      toast.error(error.message || '搜索图库失败，请重试');
    } finally {
      setIsSearchingImage((prev) => ({ ...prev, [groupId]: null }));
    }
  }, [toast]);

  // 2. AI 绘画生图方法
  const generateImage = useCallback(async (
    groupId: string,
    keyword: string,
    onUpdateOptions: (newOption: SuggestedImageOption) => void
  ) => {
    if (!keyword.trim()) {
      toast.error('请描述你想要 AI 绘制的画面');
      return;
    }

    setIsSearchingImage((prev) => ({ ...prev, [groupId]: 'generate' }));
    toast.info('AI 正在发挥创意画图，需耗时 5-10 秒，请稍后...', 5000);

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, type: 'generate' }),
      });

      const contentType = res.headers.get('content-type');
      let data: any = null;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error(`服务器生图响应格式异常 (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data?.error || 'AI 绘画生图失败');
      }

      const aiImage = data.options?.[0];
      if (!aiImage || !aiImage.url) {
        throw new Error('未返回有效的生成图 URL');
      }

      const imageUrl = aiImage.url;

      // 轮询预加载生成的图片以确保其已在 CDN 可用 (避免加载出白图)
      let isReady = false;
      let attempts = 0;
      while (!isReady && attempts < 10) {
        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => reject(new Error('CDN Not Ready'));
            img.src = imageUrl;
          });
          isReady = true;
        } catch (e) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      onUpdateOptions({
        id: aiImage.id || `ai_gen_${Date.now()}`,
        url: imageUrl,
        thumb: aiImage.thumb || imageUrl,
        photographer: aiImage.photographer || 'AI 生成',
        page_url: aiImage.page_url || imageUrl,
      });

      toast.success('AI 艺术画作生成成功！已加入备选区 🎨');
    } catch (error: any) {
      console.error('Image Generation Hook Error:', error);
      toast.error(error.message || 'AI 生图失败，请重试');
    } finally {
      setIsSearchingImage((prev) => ({ ...prev, [groupId]: null }));
    }
  }, [toast]);

  return {
    customKeywords,
    setCustomKeyword,
    isSearchingImage,
    searchImage,
    generateImage,
  };
};
