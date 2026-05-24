'use client';

/**
 * @file Select.tsx
 * @description 高端扁平风的下拉选择框组件，支持前置图标与原生下拉框的高级统一样式。
 * @author Antigravity (AI Architect)
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** 下拉框左侧前置图标 */
  icon?: React.ReactNode;
  /** 选项列表 */
  options?: SelectOption[];
  /** 下拉容器额外样式类名 */
  containerClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  options = [],
  icon,
  className = '',
  containerClassName = '',
  children,
  ...props
}) => {
  return (
    <div className={`relative flex items-center bg-gray-50/80 hover:bg-gray-100/60 border border-gray-200/80 rounded-xl px-3 py-1.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${containerClassName}`}>
      {icon && <span className="text-gray-500 mr-2 shrink-0">{icon}</span>}
      
      <select
        className={`w-full bg-transparent border-none outline-none text-gray-800 text-sm font-medium cursor-pointer pr-5 appearance-none ${className}`}
        {...props}
      >
        {children ? children : options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-gray-800">
            {opt.label}
          </option>
        ))}
      </select>
      
      <span className="absolute right-3 pointer-events-none text-gray-400">
        <ChevronDown className="w-4 h-4" />
      </span>
    </div>
  );
};
