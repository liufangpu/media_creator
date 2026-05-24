'use client';

/**
 * @file page.tsx
 * @description 主应用单页组装入口。管理共享的平台、润色、配图状态。
 *              深度集成行业与自定义 Prompt 模板管理系统，支持流式 SSE 生成。
 *              同时修复了 XSS 漏洞，杜绝了 inline js 属性的引入。
 * @author Antigravity (AI Architect)
 */

import { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { parseMarkdown, parseVideoScript } from '@/utils/markdownRenderer';
import { Copy, Download, Sparkles } from 'lucide-react';

// 自定义 UI 组件与挂钩
import { useToast } from '@/components/ui/Toast';
import { useClipboard } from '@/hooks/useClipboard';
import { useImageSearch } from '@/hooks/useImageSearch';
import { useFormat } from '@/hooks/useFormat';
import { useTemplates } from '@/hooks/useTemplates';

// 页面级排版视图与操作组件
import { Header } from '@/components/Header';
import { TextEditor } from '@/components/Editor/TextEditor';
import { PlatformTabs } from '@/components/Preview/PlatformTabs';
import { WechatPreview } from '@/components/Preview/WechatPreview';
import { XiaohongshuPreview } from '@/components/Preview/XiaohongshuPreview';
import { VideoScriptPreview } from '@/components/Preview/VideoScriptPreview';
import { ImageGallery } from '@/components/ImageGallery/ImageGallery';
import { TemplateSelector } from '@/components/TemplateSelector';

import { PlatformType, PolishLevel, ThemeType, SuggestedImage, SuggestedImageOption } from '@/types';

export default function Home() {
  const toast = useToast();

  // 1. 系统核心参数状态
  const [inputText, setInputText] = useState('');
  const [polishLevel, setPolishLevel] = useState<PolishLevel>('none');
  const [platform, setPlatform] = useState<PlatformType>('wechat');

  // 2. 按平台隔离的映射字典（状态提升与各端隔离）
  const [htmlOutputs, setHtmlOutputs] = useState<Record<PlatformType, string>>({
    wechat: '',
    xiaohongshu: '',
    video_script: '',
  });
  const [rawMarkdowns, setRawMarkdowns] = useState<Record<PlatformType, string>>({
    wechat: '',
    xiaohongshu: '',
    video_script: '',
  });
  const [currentThemes, setCurrentThemes] = useState<Record<PlatformType, ThemeType>>({
    wechat: 'tech',
    xiaohongshu: 'neutral',
    video_script: 'neutral',
  });
  const [suggestedImagesMap, setSuggestedImagesMap] = useState<Record<PlatformType, SuggestedImage[]>>({
    wechat: [],
    xiaohongshu: [],
    video_script: [],
  });
  const [placedImagesMap, setPlacedImagesMap] = useState<Record<PlatformType, Record<string, string>>>({
    wechat: {},
    xiaohongshu: {},
    video_script: {},
  });

  // 3. 自定义封装 Hooks 与模板状态管理
  const { copyRichText } = useClipboard();
  const { isProcessing, errorMessage, setErrorMessage, formatContentStream } = useFormat();
  const {
    customKeywords,
    setCustomKeyword,
    isSearchingImage,
    searchImage,
    generateImage,
  } = useImageSearch();
  const {
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    currentTemplate,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useTemplates(platform);

  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // 方便获取当前平台数据的别名变量
  const htmlOutput = htmlOutputs[platform];
  const rawMarkdown = rawMarkdowns[platform];
  const currentTheme = currentThemes[platform];
  const suggestedImages = suggestedImagesMap[platform];
  const placedImages = placedImagesMap[platform];

  // 4. 当 Markdown、排版风格或拖放配图变化时，重新渲染当前平台的 HTML
  useEffect(() => {
    if (!rawMarkdown) {
      setHtmlOutputs((prev) => ({ ...prev, [platform]: '' }));
      return;
    }

    let rawHtml = '';
    if (platform === 'video_script') {
      rawHtml = parseVideoScript(rawMarkdown);
    } else {
      rawHtml = parseMarkdown(rawMarkdown, currentTheme, placedImages);
    }

    // 安全审计改进：严格清洗 HTML，排除 onmouseover / onmouseout 等具有 XSS 注入风险的属性
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li',
        'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead',
        'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'span',
      ],
      ALLOWED_ATTR: ['href', 'name', 'target', 'src', 'alt', 'style', 'class', 'width', 'height', 'data-id'],
    });

    setHtmlOutputs((prev) => ({ ...prev, [platform]: cleanHtml }));
  }, [rawMarkdown, currentTheme, placedImages, platform]);

  // 5. 原生 HTML5 拖拽事件处理
  const handleDragOver = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    const dropzone = target.closest('.image-dropzone') as HTMLElement;
    if (dropzone) {
      e.preventDefault();
      dropzone.classList.add('dropzone-hover');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    const dropzone = target.closest('.image-dropzone') as HTMLElement;
    if (dropzone) {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (relatedTarget && dropzone.contains(relatedTarget)) return;
      dropzone.classList.remove('dropzone-hover');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    const dropzone = target.closest('.image-dropzone') as HTMLElement;
    if (dropzone) {
      e.preventDefault();
      dropzone.classList.remove('dropzone-hover');

      const id = dropzone.getAttribute('data-id');
      if (!id) return;

      let imageUrl = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      if (!imageUrl && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          imageUrl = URL.createObjectURL(file);
        }
      }

      if (imageUrl) {
        setPlacedImagesMap((prev) => ({
          ...prev,
          [platform]: { ...prev[platform], [id]: imageUrl },
        }));
      }
    }
  };

  // 6. 调用 AI 格式化流式接口
  const handleFormat = async () => {
    // 启动前先重置当前平台的视图状态，保持流式渲染启动时的纯净性
    setRawMarkdowns((prev) => ({ ...prev, [platform]: '' }));
    setHtmlOutputs((prev) => ({ ...prev, [platform]: '' }));
    setPlacedImagesMap((prev) => ({ ...prev, [platform]: {} }));
    setSuggestedImagesMap((prev) => ({ ...prev, [platform]: [] }));

    await formatContentStream(
      inputText,
      polishLevel,
      platform,
      {
        onChunk: (textChunk) => {
          setRawMarkdowns((prev) => ({
            ...prev,
            [platform]: prev[platform] + textChunk,
          }));
        },
        onMeta: (theme, suggestedImages) => {
          if (theme && ['tech', 'emotion', 'neutral', 'xiaohongshu', 'news', 'vlog'].includes(theme)) {
            setCurrentThemes((prev) => ({ ...prev, [platform]: theme as ThemeType }));
          }
          if (suggestedImages) {
            setSuggestedImagesMap((prev) => ({
              ...prev,
              [platform]: suggestedImages,
            }));
          }
        },
        onDone: () => {
          // 完成回调，流终点状态已在 hook 中处理
        },
      },
      currentTemplate?.systemPrompt // 传入当前选定主编风格的 Prompt 设定说明
    );
  };

  // 7. 一键富文本复制
  const handleCopy = async () => {
    await copyRichText(htmlOutput);
  };

  // 8. 智能配图选项状态单向流式更新
  const updateImageOptions = (groupId: string, newOptions: SuggestedImageOption[]) => {
    setSuggestedImagesMap((prev) => ({
      ...prev,
      [platform]: prev[platform].map((group) =>
        group.id === groupId ? { ...group, options: newOptions } : group
      ),
    }));
  };

  const updateSingleImageOption = (groupId: string, newOption: SuggestedImageOption) => {
    setSuggestedImagesMap((prev) => ({
      ...prev,
      [platform]: prev[platform].map((group) => {
        if (group.id === groupId) {
          return { ...group, options: [newOption, ...group.options] };
        }
        return group;
      }),
    }));
  };

  // 9. 短视频脚本提词器口播文本解析与下载
  const handleDownloadTeleprompter = () => {
    if (!rawMarkdown) return;

    let teleprompterText = '';
    const titleMatch = rawMarkdown.match(/^#{1,2}\s+(.*)$/m);
    if (titleMatch) {
      teleprompterText += `【视频标题】\n${titleMatch[1].trim()}\n\n【口播提词】\n`;
    } else {
      teleprompterText += `【口播提词】\n`;
    }

    const lines = rawMarkdown.split('\n');
    let inTable = false;
    for (let line of lines) {
      line = line.trim();
      if (/^\|[-:| ]+\|$/.test(line) || /^[-:| ]+$/.test(line)) {
        inTable = true;
        continue;
      }

      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) continue;
        const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
        if (cells.length >= 2) {
          const cleanText = cells[1]
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/_+(.*?)_+/g, '$1')
            .trim();
          if (cleanText) {
            teleprompterText += `${cleanText}\n`;
          }
        }
      }
    }

    if (!teleprompterText.trim() || teleprompterText.includes('【口播提词】\n\n')) {
      toast.error('未检测到有效的短视频口播文案，请生成脚本后再试 🎬');
      return;
    }

    const blob = new Blob([teleprompterText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `短视频提词脚本_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('提词脚本下载成功！直接导入提词软件即可使用 🚀');
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50 flex flex-col font-sans">
      {/* 顶部导航面板 */}
      <Header
        polishLevel={polishLevel}
        onPolishLevelChange={setPolishLevel}
        platform={platform}
        currentTheme={currentTheme}
        onThemeChange={(newTheme) => setCurrentThemes((prev) => ({ ...prev, [platform]: newTheme }))}
        isProcessing={isProcessing}
        onGenerate={handleFormat}
        hasInput={!!inputText.trim()}
        selectedTemplateName={
          currentTemplate ? `${currentTemplate.icon} ${currentTemplate.name}` : undefined
        }
        onOpenTemplateSelector={() => setIsTemplateSelectorOpen(true)}
      />

      {/* API 错误全局警示框 */}
      {errorMessage && (
        <div className="bg-rose-50 text-rose-600 px-6 py-3 border-b border-rose-100 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-2">
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-400 hover:text-rose-700 font-bold px-2 py-1 shrink-0"
          >
            关闭
          </button>
        </div>
      )}

      {/* 主工作区 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左侧：内容输入 */}
        <TextEditor value={inputText} onChange={setInputText} />

        {/* 右侧：预览与配图分发区 */}
        <div
          className={`flex flex-col bg-gray-100 relative ${suggestedImages.length > 0 && (platform === 'wechat' || platform === 'xiaohongshu')
              ? 'w-1/3 border-r border-gray-200'
              : 'w-1/2'
            }`}
        >
          {/* 平台标签切换 */}
          <PlatformTabs activeTab={platform} onTabChange={setPlatform} />

          {/* 快速复制/辅助面板 */}
          <div className="px-5 py-3 border-b border-gray-200/80 bg-white flex justify-between items-center z-10 shrink-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {platform === 'wechat' && '📱 微信排版效果 (附带智能配图)'}
              {platform === 'xiaohongshu' && '📱 小红书爆款卡片仿真'}
              {platform === 'video_script' && '🎬 抖音/视频号分镜脚本表格'}
            </span>
            <div className="flex items-center gap-2">
              {platform === 'video_script' && htmlOutput && (
                <button
                  onClick={handleDownloadTeleprompter}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载提词文本
                </button>
              )}
              <button
                onClick={handleCopy}
                disabled={!htmlOutput || isProcessing}
                className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-4 py-1.5 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                一键复制结果
              </button>
            </div>
          </div>

          {/* 仿真设备视口 */}
          <div className="flex-1 p-6 flex justify-center bg-gray-50 overflow-hidden">
            <div
              className={`bg-white shadow-2xl w-full h-full rounded-3xl border-4 border-gray-200/60 overflow-hidden relative flex flex-col transition-all duration-300 ${platform === 'video_script' ? 'max-w-[720px]' : 'max-w-[375px]'
                }`}
            >
              {htmlOutput ? (
                platform === 'xiaohongshu' ? (
                  <XiaohongshuPreview
                    ref={previewRef}
                    htmlOutput={htmlOutput}
                    suggestedImages={suggestedImages}
                    placedImages={placedImages}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  />
                ) : platform === 'wechat' ? (
                  <WechatPreview
                    ref={previewRef}
                    htmlOutput={htmlOutput}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  />
                ) : (
                  <VideoScriptPreview ref={previewRef} htmlOutput={htmlOutput} />
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3.5 mt-20">
                  <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center shadow-inner">
                    <Sparkles className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-xs text-center px-6 leading-relaxed text-gray-400 font-medium">
                    在左侧贴入脑暴草稿，选择上方的目标平台后点击
                    <br />
                    <strong className="text-blue-500 font-bold block mt-1">
                      「一键生成多平台内容」
                    </strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：图片配图推荐画廊（仅在微信或小红书模式且有推荐配图时显示） */}
        <ImageGallery
          suggestedImages={suggestedImages}
          customKeywords={customKeywords}
          onKeywordChange={setCustomKeyword}
          isSearchingImage={isSearchingImage}
          onSearchImage={(groupId, kw) =>
            searchImage(groupId, kw, (opts) => updateImageOptions(groupId, opts))
          }
          onGenerateImage={(groupId, kw) =>
            generateImage(groupId, kw, (opt) => updateSingleImageOption(groupId, opt))
          }
        />
      </main>

      {/* 行业及自创主编风格选择器抽屉弹框 */}
      <TemplateSelector
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={setSelectedTemplateId}
        platform={platform}
        onAddTemplate={addTemplate}
        onUpdateTemplate={updateTemplate}
        onDeleteTemplate={deleteTemplate}
      />
    </div>
  );
}
