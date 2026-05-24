'use client';

/**
 * @file Button.tsx
 * @description 扁平现代的通用按钮组件，符合 Google 编程规范，支持 Loading 态、Disabled 态与图标定制。
 * @author Antigravity (AI Architect)
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮风格样式变体 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** 按钮大小尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否处于加载中状态 */
  isLoading?: boolean;
  /** 按钮左侧图标 */
  leftIcon?: React.ReactNode;
  /** 按钮右侧图标 */
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  ...props
}) => {
  // 基础样式
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed';

  // 变体样式
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:bg-blue-800',
    secondary: 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm active:bg-gray-100',
    ghost: 'bg-transparent hover:bg-gray-100/80 text-gray-600 active:bg-gray-200/60',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow active:bg-rose-800',
  };

  // 尺寸样式
  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2 text-sm gap-2',
    lg: 'px-6 py-2.5 text-base gap-2.5',
  };

  const isBtnDisabled = disabled || isLoading;

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isBtnDisabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      
      <span>{children}</span>
      
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
