'use client';

/**
 * @file useFormat.ts
 * @description 封装 AI 格式化内容请求逻辑的自定义 Hook，升级支持 Server-Sent Events (SSE) 流式消费协议。
 *              采用 ReadableStream + TextDecoder 双通道非阻塞流读取，确保极佳的用户即时浏览体验。
 * @author Antigravity (AI Architect)
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { PlatformType, PolishLevel } from '@/types';

export interface FormatCallbacks {
  /** 当收到 AI 吐出的新文字片段时的回调 */
  onChunk: (text: string) => void;
  /** 当流结束阶段收到后端解析的主题和图片推荐时的回调 */
  onMeta: (theme: string, suggestedImages: any[]) => void;
  /** 当流成功传输完毕时的回调 */
  onDone: () => void;
}

export interface UseFormatReturn {
  /** 是否处于处理中 */
  isProcessing: boolean;
  /** 异常错误描述 */
  errorMessage: string;
  /** 重置错误描述 */
  setErrorMessage: (msg: string) => void;
  /**
   * 触发流式 SSE 内容生成
   * @param text 用户输入的草稿文本
   * @param polishLevel 润色等级
   * @param platform 目标平台
   * @param callbacks 流式生命周期回调函数集合
   * @param customPrompt 可选的自定义主编设定的系统 Prompt
   */
  formatContentStream: (
    text: string,
    polishLevel: PolishLevel,
    platform: PlatformType,
    callbacks: FormatCallbacks,
    customPrompt?: string
  ) => Promise<boolean>;
}

export const useFormat = (): UseFormatReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const toast = useToast();

  const formatContentStream = useCallback(
    async (
      text: string,
      polishLevel: PolishLevel,
      platform: PlatformType,
      callbacks: FormatCallbacks,
      customPrompt?: string
    ): Promise<boolean> => {
      if (!text.trim()) {
        toast.error('请提供需要排版的草稿内容');
        return false;
      }

      setIsProcessing(true);
      setErrorMessage('');

      try {
        const response = await fetch('/api/format', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, polishLevel, platform, customPrompt }),
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errData = await response.json();
            throw new Error(errData.error || '请求排版引擎服务失败');
          } else {
            const errText = await response.text();
            throw new Error(`服务器响应异常 (状态码: ${response.status}) ${errText.slice(0, 100)}`);
          }
        }

        // 检查响应体是否支持流式读取
        if (!response.body) {
          throw new Error('服务器响应数据流为空，可能是不支持 ReadableStream');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        // 循环读取数据流块
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 解码数据块并拼接到行级缓冲区
          buffer += decoder.decode(value, { stream: true });
          
          // 根据 SSE 标准协议使用双换行符 \n\n 拆分事件帧
          const lines = buffer.split('\n\n');
          
          // 保留未结束的半个事件帧在缓冲区中，供下一轮拼接
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // 提取 data: 帧数据
            if (trimmedLine.startsWith('data: ')) {
              const jsonStr = trimmedLine.slice(6);
              try {
                const eventData = JSON.parse(jsonStr);

                switch (eventData.type) {
                  case 'chunk':
                    // 接收即时文本碎片并触发回调
                    if (eventData.content) {
                      callbacks.onChunk(eventData.content);
                    }
                    break;
                  case 'meta':
                    // 接收主题及智能推荐配图元数据
                    callbacks.onMeta(eventData.theme, eventData.suggestedImages);
                    break;
                  case 'done':
                    // 触发流结束完成回调
                    callbacks.onDone();
                    toast.success('AI 排版生成完成！✨');
                    return true;
                  case 'error':
                    // 接收流异常帧
                    throw new Error(eventData.message || '生成流处理中途发生故障');
                  default:
                    break;
                }
              } catch (parseErr) {
                console.error('SSE JSON 解析异常:', jsonStr, parseErr);
              }
            }
          }
        }

        return true;
      } catch (err: any) {
        console.error('SSE Flow Consumption Error:', err);
        const errMsg = err.message || '请求处理超时或网络连接中断，请重试。';
        setErrorMessage(errMsg);
        toast.error('大模型流式传输失败，请看顶部详情');
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [toast]
  );

  return {
    isProcessing,
    errorMessage,
    setErrorMessage,
    formatContentStream,
  };
};
