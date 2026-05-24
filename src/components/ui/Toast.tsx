'use client';

/**
 * @file Toast.tsx
 * @description 优雅的轻量全局 Toast 提示组件，支持 success, error, info 状态及动画淡出。
 * @author Antigravity (AI Architect)
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// Toast 类型定义
export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * 全局 Toast 上下文 Provider
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // 移除指定 ID 的 Toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // 添加 Toast 并设置自动销毁定时器
  const addToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message: string, duration?: number) => addToast(message, 'error', duration), [addToast]);
  const info = useCallback((message: string, duration?: number) => addToast(message, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: { success, error, info } }}>
      {children}
      
      {/* Toast 渲染容器 - 悬浮在右上角 */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((item) => {
          // 根据类型定制样式
          let bgClass = 'bg-white text-gray-800 border-gray-100 shadow-lg';
          let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;
          
          if (item.type === 'success') {
            bgClass = 'bg-emerald-50 text-emerald-900 border-emerald-100 shadow-emerald-100/50 shadow-md';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
          } else if (item.type === 'error') {
            bgClass = 'bg-rose-50 text-rose-900 border-rose-100 shadow-rose-100/50 shadow-md';
            icon = <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />;
          }

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-4 rounded-xl border pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-200 ${bgClass}`}
              role="alert"
            >
              {icon}
              <div className="flex-1 text-sm font-medium leading-5">{item.message}</div>
              <button
                onClick={() => removeToast(item.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded p-0.5"
                aria-label="Close message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * 现代 useToast 挂钩
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
