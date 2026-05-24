'use client';

/**
 * @file TemplateSelector.tsx
 * @description 行业 Prompt 模板选择及管理抽屉模态框，提供对预置模板的选择
 *              以及自定义模板的新建、更新、删除等操作，表单交互细致平滑。
 * @author Antigravity (AI Architect)
 */

import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, Edit3, X, Search, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PromptTemplate, PlatformType } from '@/types';

export interface TemplateSelectorProps {
  /** 模态框打开状态 */
  isOpen: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
  /** 可选的主编模板列表 */
  templates: PromptTemplate[];
  /** 当前选中的模板 ID */
  selectedTemplateId: string | null;
  /** 选中模板的回调 */
  onSelectTemplate: (id: string | null) => void;
  /** 当前的平台类型（用于默认关联） */
  platform: PlatformType;
  /** 新增模板回调 */
  onAddTemplate: (template: Omit<PromptTemplate, 'id' | 'category'>) => void;
  /** 修改模板回调 */
  onUpdateTemplate: (id: string, template: Partial<PromptTemplate>) => void;
  /** 删除模板回调 */
  onDeleteTemplate: (id: string) => void;
}

type ViewMode = 'list' | 'create' | 'edit';

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  platform,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 编辑/新建表单临时状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('✍️');
  const [formDesc, setFormDesc] = useState('');
  const [formSystemPrompt, setFormSystemPrompt] = useState('');
  const [formPlatforms, setFormPlatforms] = useState<PlatformType[]>([platform]);

  if (!isOpen) return null;

  // 1. 过滤搜索模板
  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. 初始化新建表单
  const handleOpenCreate = () => {
    setFormName('');
    setFormIcon('✍️');
    setFormDesc('');
    setFormSystemPrompt('');
    setFormPlatforms([platform]);
    setViewMode('create');
  };

  // 3. 初始化编辑表单
  const handleOpenEdit = (template: PromptTemplate) => {
    setEditingId(template.id);
    setFormName(template.name);
    setFormIcon(template.icon);
    setFormDesc(template.description);
    setFormSystemPrompt(template.systemPrompt);
    setFormPlatforms(template.platforms);
    setViewMode('edit');
  };

  // 4. 提交创建或修改
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSystemPrompt.trim()) return;

    const data = {
      name: formName,
      icon: formIcon,
      description: formDesc || '自定义专属主编风格',
      systemPrompt: formSystemPrompt,
      platforms: formPlatforms,
    };

    if (viewMode === 'create') {
      onAddTemplate(data);
    } else if (viewMode === 'edit' && editingId) {
      onUpdateTemplate(editingId, data);
    }

    setViewMode('list');
  };

  // 切换平台的关联支持
  const togglePlatform = (p: PlatformType) => {
    if (formPlatforms.includes(p)) {
      if (formPlatforms.length > 1) {
        setFormPlatforms(formPlatforms.filter((item) => item !== p));
      }
    } else {
      setFormPlatforms([...formPlatforms, p]);
    }
  };

  const emojiOptions = ['✍️', '💡', '🚀', '🔥', '🎨', '🌟', '🍜', '📱', '💄', '📚', '💼', '🏠', '🏋️', '🌍'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[560px] shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* A. 头部导航栏 */}
        <div className="px-6 py-4.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-gray-800">
              {viewMode === 'list' && '请选择专属排版主编风格'}
              {viewMode === 'create' && '定制我的专属 AI 主编'}
              {viewMode === 'edit' && '编辑专属 AI 主编配置'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* B. 核心主内容区 */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 custom-scrollbar">
          
          {/* VIEW 1: 列表模式 */}
          {viewMode === 'list' && (
            <div className="space-y-5 h-full flex flex-col">
              {/* 搜索与新增行 */}
              <div className="flex gap-3 shrink-0">
                <div className="flex-1 relative flex items-center bg-gray-50 border border-gray-200/80 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                  <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="搜寻我想要的主编风格（如美食、职场...）"
                    className="w-full bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleOpenCreate}
                  leftIcon={<Plus className="w-4 h-4" />}
                  variant="secondary"
                  className="rounded-xl shrink-0 cursor-pointer"
                >
                  定制主编
                </Button>
              </div>

              {/* 默认“无特定风格”选项 */}
              <div className="shrink-0">
                <div
                  onClick={() => {
                    onSelectTemplate(null);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                    selectedTemplateId === null
                      ? 'border-blue-500 bg-blue-50/10 shadow-sm'
                      : 'border-gray-200/80 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">系统通用排版风格</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">默认预置的标准润色与格式化分发策略</p>
                    </div>
                  </div>
                  {selectedTemplateId === null && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {/* 模板列表显示区域 */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-0">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((item) => {
                    const isSelected = selectedTemplateId === item.id;
                    const isCustom = item.category === 'custom';

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectTemplate(item.id);
                          onClose();
                        }}
                        className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4.5 cursor-pointer relative group ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/10 shadow-md shadow-blue-500/5'
                            : 'border-gray-200/80 hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                      >
                        {/* 左侧 Emoji 图标 */}
                        <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-xs border border-gray-100 group-hover:scale-105 transition-transform">
                          {item.icon}
                        </div>

                        {/* 中间信息 */}
                        <div className="flex-1 min-w-0 pr-16">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-800 truncate">
                              {item.name}
                            </h4>
                            {isCustom && (
                              <span className="text-[8px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-100">
                                自定义
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        {/* 右侧交互控件 */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          {isCustom && (
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(item);
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="编辑模板"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTemplate(item.id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="删除模板"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {isSelected ? (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                    没有找到符合筛选的主编风格，点击“定制主编”创造一个吧 ✨
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2 & 3: 新建 / 编辑表单模式 */}
          {(viewMode === 'create' || viewMode === 'edit') && (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* 表单排版两栏布局：名称与图标 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">主编名称</label>
                  <input
                    type="text"
                    required
                    placeholder="如：毒舌数码评测员"
                    className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium text-gray-800"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">代表图标</label>
                  <select
                    className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all cursor-pointer font-medium text-gray-800"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                  >
                    {emojiOptions.map((emoji) => (
                      <option key={emoji} value={emoji}>
                        {emoji}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 描述信息 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">定位描述</label>
                <input
                  type="text"
                  placeholder="用一句话总结主编风格定位，方便后续查找"
                  className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium text-gray-800"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              {/* 核心指令 System Prompt */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-500">设定 Prompt 指令 (最核心)</label>
                  <span className="text-[10px] text-gray-400">大模型扮演此人时的系统设定说明</span>
                </div>
                <textarea
                  required
                  rows={5}
                  placeholder="例如：你是一位幽默风趣、善于说梗的数码博主。写作时多使用调侃的语气，多使用感叹号，排版注重条理，每句话必须以 Emoji 结尾..."
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all font-medium leading-relaxed text-gray-800 resize-none"
                  value={formSystemPrompt}
                  onChange={(e) => setFormSystemPrompt(e.target.value)}
                />
              </div>

              {/* 适用平台 */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 block">适用分发平台（至少选一个）</label>
                <div className="flex gap-4">
                  {(['wechat', 'xiaohongshu', 'video_script'] as PlatformType[]).map((p) => {
                    const isChecked = formPlatforms.includes(p);
                    let label = '微信公众号';
                    if (p === 'xiaohongshu') label = '小红书文案';
                    if (p === 'video_script') label = '短视频脚本';

                    return (
                      <div
                        key={p}
                        onClick={() => togglePlatform(p)}
                        className={`px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
                          isChecked
                            ? 'border-blue-500 bg-blue-50/10 text-blue-600'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 表单控制按钮 */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 shrink-0">
                <Button
                  onClick={() => setViewMode('list')}
                  variant="ghost"
                  className="rounded-xl cursor-pointer"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="rounded-xl shadow-md cursor-pointer"
                >
                  保存模板
                </Button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
