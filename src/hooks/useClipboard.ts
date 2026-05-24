'use client';

/**
 * @file useClipboard.ts
 * @description 封装现代 Clipboard API 的复制 hook，支持同时写入 HTML 富文本与 Plain Text 纯文本，
 *              完美解决微信公众号、小红书后台粘贴格式丢失的问题。
 * @author Antigravity (AI Architect)
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

export interface UseClipboardReturn {
  /** 是否处于复制中/已复制完的短暂成功态 */
  copied: boolean;
  /**
   * 复制 HTML 富文本与纯文本到剪贴板
   * @param htmlContent 要复制的 HTML 富文本内容
   * @param plainTextFallback 可选的纯文本备选方案（如果不传，会自动从 HTML 中提取纯文本）
   */
  copyRichText: (htmlContent: string, plainTextFallback?: string) => Promise<boolean>;
}

export const useClipboard = (): UseClipboardReturn => {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const copyRichText = useCallback(async (htmlContent: string, plainTextFallback?: string): Promise<boolean> => {
    if (!htmlContent) {
      toast.error('无可复制的内容');
      return false;
    }

    try {
      // 1. 提取纯文本（作为 fallback，如果用户没有传入）
      let plainText = plainTextFallback;
      if (!plainText) {
        // 创建临时 DOM 节点以提取文本
        if (typeof window !== 'undefined') {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlContent;
          plainText = tempDiv.textContent || tempDiv.innerText || '';
        } else {
          plainText = htmlContent.replace(/<[^>]*>/g, '');
        }
      }

      // 2. 构造符合现代剪贴板标准的 ClipboardItem 数组
      // 微信公众号等编辑器高度依赖 'text/html' 类型的剪贴板数据
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });

      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });

      // 3. 写入剪贴板
      await navigator.clipboard.write([clipboardItem]);
      
      setCopied(true);
      toast.success('已成功复制富文本！可以直接去平台编辑器粘贴啦 🎉');

      // 3秒后恢复复制状态
      setTimeout(() => {
        setCopied(false);
      }, 3000);

      return true;
    } catch (error) {
      console.error('富文本复制失败, 尝试降级处理:', error);
      
      // 降级方案：常规纯文本复制
      try {
        if (typeof window !== 'undefined') {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlContent;
          const text = tempDiv.textContent || '';
          await navigator.clipboard.writeText(text);
          
          setCopied(true);
          toast.info('已复制纯文本格式（您的浏览器可能不支持富文本复制）');
          
          setTimeout(() => {
            setCopied(false);
          }, 3000);
          
          return true;
        }
        return false;
      } catch (err) {
        console.error('所有复制途径均失败:', err);
        toast.error('复制失败，请手动选择内容进行复制 😢');
        return false;
      }
    }
  }, [toast]);

  return { copied, copyRichText };
};
