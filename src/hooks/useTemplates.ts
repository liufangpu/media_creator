'use client';

/**
 * @file useTemplates.ts
 * @description 管理 AI 排版提示词模板的 Hook，支持内置模板合并以及自定义模板的 LocalStorage CRUD 状态管理。
 *              采取严密的 window 检测，防止 Next.js 产生 Hydration SSR 渲染不一致警告。
 * @author Antigravity (AI Architect)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PromptTemplate, PlatformType } from '@/types';
import { BUILTIN_TEMPLATES } from '@/lib/templates';
import { useToast } from '@/components/ui/Toast';

const LOCAL_STORAGE_KEY = 'media_creator_custom_prompts';

export interface UseTemplatesReturn {
  /** 整合后的所有模板列表（内置 + 自定义） */
  templates: PromptTemplate[];
  /** 自定义模板列表 */
  customTemplates: PromptTemplate[];
  /** 当前选中的模板 ID */
  selectedTemplateId: string | null;
  /** 选择模板 */
  setSelectedTemplateId: (id: string | null) => void;
  /** 获取当前选中模板的便利对象 */
  currentTemplate: PromptTemplate | undefined;
  /**
   * 新增自定义 Prompt 模板
   * @param template 模板定义
   */
  addTemplate: (template: Omit<PromptTemplate, 'id' | 'category'>) => void;
  /**
   * 编辑更新自定义 Prompt 模板
   * @param id 模板 ID
   * @param template 待更新字段
   */
  updateTemplate: (id: string, template: Partial<PromptTemplate>) => void;
  /**
   * 删除自定义 Prompt 模板
   * @param id 模板 ID
   */
  deleteTemplate: (id: string) => void;
}

export const useTemplates = (platform: PlatformType): UseTemplatesReturn => {
  const toast = useToast();
  const [customTemplates, setCustomTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // 1. 初始化时，从 localStorage 安全载入用户自定义模板
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          setCustomTemplates(JSON.parse(stored));
        }
      } catch (err) {
        console.error('从 LocalStorage 恢复自定义 Prompt 模板失败:', err);
      }
    }
  }, []);

  // 2. 将自定义模板变动落盘持久化
  const saveCustomTemplates = useCallback((newCustom: PromptTemplate[]) => {
    setCustomTemplates(newCustom);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCustom));
      } catch (err) {
        console.error('持久化自定义模板失败:', err);
      }
    }
  }, []);

  // 3. 过滤出契合当前平台的所有模板列表 (内置 + 自定义)
  const templates = useMemo(() => {
    const combined = [...BUILTIN_TEMPLATES, ...customTemplates];
    // 过滤：仅展示支持当前排版平台的模板
    return combined.filter((t) => t.platforms.includes(platform));
  }, [customTemplates, platform]);

  // 获取当前选中模板便利方法
  const currentTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId);
  }, [templates, selectedTemplateId]);

  // 4. CRUD: 新增自定义 Prompt 模板
  const addTemplate = useCallback((template: Omit<PromptTemplate, 'id' | 'category'>) => {
    const newTemplate: PromptTemplate = {
      ...template,
      id: `custom_${Date.now()}`,
      category: 'custom',
    };

    saveCustomTemplates([...customTemplates, newTemplate]);
    setSelectedTemplateId(newTemplate.id); // 自动选中新模板
    toast.success(`自定义主编模板「${newTemplate.name}」创建成功！🎨`);
  }, [customTemplates, saveCustomTemplates, toast]);

  // 5. CRUD: 修改自定义 Prompt 模板
  const updateTemplate = useCallback((id: string, updatedFields: Partial<PromptTemplate>) => {
    const updated = customTemplates.map((t) => {
      if (t.id === id) {
        return { ...t, ...updatedFields } as PromptTemplate;
      }
      return t;
    });

    saveCustomTemplates(updated);
    toast.success('模板信息更新成功！✏️');
  }, [customTemplates, saveCustomTemplates, toast]);

  // 6. CRUD: 删除自定义 Prompt 模板
  const deleteTemplate = useCallback((id: string) => {
    const filtered = customTemplates.filter((t) => t.id !== id);
    saveCustomTemplates(filtered);
    
    // 如果当前选中的是被删除的模板，重置选中状态
    if (selectedTemplateId === id) {
      setSelectedTemplateId(null);
    }
    toast.success('已删除该自定义主编模板 🗑️');
  }, [customTemplates, selectedTemplateId, saveCustomTemplates, toast]);

  return {
    templates,
    customTemplates,
    selectedTemplateId,
    setSelectedTemplateId,
    currentTemplate,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
