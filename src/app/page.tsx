'use client';

import { useState, useRef, useEffect } from 'react';
import { parseMarkdown, parseVideoScript } from '@/utils/markdownRenderer';
import { Copy, Sparkles, RefreshCw, PenTool, Smartphone, BookOpen, Video, Search, Wand2, Download } from 'lucide-react';
import DOMPurify from 'dompurify';

type PolishLevel = 'none' | 'fix' | 'rewrite';
type ThemeType = 'tech' | 'emotion' | 'news' | 'vlog' | 'neutral';
type PlatformType = 'wechat' | 'xiaohongshu' | 'video_script';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [polishLevel, setPolishLevel] = useState<PolishLevel>('none');
  const [platform, setPlatform] = useState<PlatformType>('wechat');
  const [errorMessage, setErrorMessage] = useState('');
  
  // =========================================
  // 核心重构：将原本单一的状态改为按平台隔离的映射字典
  // =========================================
  const [htmlOutputs, setHtmlOutputs] = useState<Record<PlatformType, string>>({ wechat: '', xiaohongshu: '', video_script: '' });
  const [rawMarkdowns, setRawMarkdowns] = useState<Record<PlatformType, string>>({ wechat: '', xiaohongshu: '', video_script: '' });
  const [currentThemes, setCurrentThemes] = useState<Record<PlatformType, ThemeType>>({ wechat: 'tech', xiaohongshu: 'neutral', video_script: 'neutral' });
  const [suggestedImagesMap, setSuggestedImagesMap] = useState<Record<PlatformType, Array<{ id: string, keyword: string, options: any[] }>>>({ wechat: [], xiaohongshu: [], video_script: [] });
  const [placedImagesMap, setPlacedImagesMap] = useState<Record<PlatformType, Record<string, string>>>({ wechat: {}, xiaohongshu: {}, video_script: {} });

  // 侧边栏搜图相关的状态可以共享或按图库ID隔离，不需要严格按平台区分
  const [customKeywords, setCustomKeywords] = useState<{ [key: string]: string }>({});
  const [isSearchingImage, setIsSearchingImage] = useState<{ [key: string]: 'search' | 'generate' | null }>({});

  const previewRef = useRef<HTMLDivElement>(null);

  // 方便获取当前平台数据的别名变量
  const htmlOutput = htmlOutputs[platform];
  const rawMarkdown = rawMarkdowns[platform];
  const currentTheme = currentThemes[platform];
  const suggestedImages = suggestedImagesMap[platform];
  const placedImages = placedImagesMap[platform];

  // 当 Markdown、主题或拖放的图片发生变化时，重新渲染当前平台的 HTML
  useEffect(() => {
    if (!rawMarkdown) {
      setHtmlOutputs(prev => ({ ...prev, [platform]: '' }));
      return;
    }
    
    let rawHtml = '';
    if (platform === 'video_script') {
      rawHtml = parseVideoScript(rawMarkdown);
    } else {
      rawHtml = parseMarkdown(rawMarkdown, currentTheme, placedImages);
    }
    
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'span'],
      ALLOWED_ATTR: ['href', 'name', 'target', 'src', 'alt', 'style', 'class', 'width', 'height', 'data-id', 'onmouseover', 'onmouseout'],
    });
    
    setHtmlOutputs(prev => ({ ...prev, [platform]: cleanHtml }));
  }, [rawMarkdown, currentTheme, placedImages, platform]);

  // 处理拖拽事件
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
        setPlacedImagesMap(prev => ({ 
          ...prev, 
          [platform]: { ...prev[platform], [id]: imageUrl }
        }));
      }
    }
  };

  // 调用后端 AI 接口处理文本
  const handleFormat = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      const res = await fetch('/api/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputText,
          polishLevel,
          platform // 传递目标平台
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || '请求 AI 服务失败');
      }

      const { theme, markdown, suggestedImages: newSuggestedImages } = data;
      
      if (['tech', 'emotion', 'neutral', 'xiaohongshu', 'news', 'vlog'].includes(theme)) {
        setCurrentThemes(prev => ({ ...prev, [platform]: theme as ThemeType }));
      }
      
      setRawMarkdowns(prev => ({ ...prev, [platform]: markdown }));
      setPlacedImagesMap(prev => ({ ...prev, [platform]: {} })); // 清空当前平台已放置的图片
      
      if (newSuggestedImages) {
        setSuggestedImagesMap(prev => ({ ...prev, [platform]: newSuggestedImages }));
      } else {
        setSuggestedImagesMap(prev => ({ ...prev, [platform]: [] }));
      }
      // HTML的渲染现在由 useEffect 统一处理

    } catch (err: any) {
      console.error('Format Error:', err);
      setErrorMessage(err.message || '系统开小差了，请检查网络或 API 密钥配置。');
    } finally {
      setIsProcessing(false);
    }
  };

  // 复制结果
  const handleCopy = async () => {
    if (!previewRef.current) return;
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(previewRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      document.execCommand('copy');
      selection?.removeAllRanges();
      
      alert('✅ 已成功复制！可以直接去对应平台后台粘贴啦。');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('复制失败，请手动全选右侧内容并复制。');
    }
  };

  // 独立检索/生成图片的请求
  const handleCustomImage = async (groupId: string, type: 'search' | 'generate') => {
    const keyword = customKeywords[groupId];
    if (!keyword?.trim()) return;

    setIsSearchingImage(prev => ({ ...prev, [groupId]: type }));

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, type }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || '请求失败');

      if (type === 'search') {
        // 更新对应图组的备选项
        setSuggestedImagesMap(prev => ({
          ...prev,
          [platform]: prev[platform].map(group => 
            group.id === groupId ? { ...group, options: data.options, keyword: keyword } : group
          )
        }));
      } else {
        const aiImage = data.options?.[0];
        if (!aiImage || !aiImage.url) throw new Error('生图API未返回有效的图片URL');
        
        const imageUrl = aiImage.url;

        // 轮询检查 AI 生成的图片是否可访问 (使用 Image 对象预加载，避免 CORS 拦截 HEAD 请求)
        let isReady = false;
        let attempts = 0;
        while (!isReady && attempts < 10) {
          try {
            await new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(true);
              img.onerror = () => reject(new Error('Image load failed'));
              img.src = imageUrl;
            });
            isReady = true;
          } catch (e) {
            attempts++;
            await new Promise(r => setTimeout(r, 2000));
          }
        }

        // AI生图，直接把新图塞进这个选项组的第一位
        setSuggestedImagesMap(prev => ({
          ...prev,
          [platform]: prev[platform].map(group => {
            if (group.id === groupId) {
              const newImg = {
                id: aiImage.id || `gen_${Date.now()}`,
                url: imageUrl,
                thumb: aiImage.thumb || imageUrl,
                photographer: aiImage.photographer || 'AI生成',
                page_url: aiImage.page_url || imageUrl
              };
              return { ...group, options: [newImg, ...group.options], keyword: keyword };
            }
            return group;
          })
        }));
      }
      
    } catch (err: any) {
      alert(`操作失败: ${err.message}`);
    } finally {
      setIsSearchingImage(prev => ({ ...prev, [groupId]: null }));
    }
  };

  // 处理下载提词器文本
  const handleDownloadTeleprompter = () => {
    if (!rawMarkdown) return;
    
    // 提取短视频的口播文案
    let teleprompterText = '';
    
    // 提取标题 (匹配 # 或 ## 开头的行)
    const titleMatch = rawMarkdown.match(/^#{1,2}\s+(.*)$/m);
    if (titleMatch) {
      teleprompterText += `【视频标题】\n${titleMatch[1].trim()}\n\n【口播提词】\n`;
    } else {
      teleprompterText += `【口播提词】\n`;
    }

    // 提取表格中的第二列（口播文案）
    const lines = rawMarkdown.split('\n');
    let inTable = false;
    for (let line of lines) {
      line = line.trim();
      // 跳过表格分割线
      if (/^\|[-:| ]+\|$/.test(line) || /^[-:| ]+$/.test(line)) {
        inTable = true; // 只要遇到分割线，下面就是数据了
        continue;
      }
      
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          // 如果还没遇到过分割线，这是表头，跳过
          continue;
        }
        // 提取数据行的第二列
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        if (cells.length >= 2) {
          // 去除 Markdown 加粗等符号，提取纯文本
          const cleanText = cells[1].replace(/\*\*(.*?)\*\*/g, '$1').replace(/_+(.*?)_+/g, '$1').trim();
          if (cleanText) {
            teleprompterText += `${cleanText}\n`;
          }
        }
      }
    }

    if (!teleprompterText.trim() || teleprompterText.includes('【口播提词】\n\n')) {
      alert('未检测到有效的短视频口播文案');
      return;
    }

    // 生成并下载 txt 文件
    const blob = new Blob([teleprompterText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `短视频提词脚本_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50 flex flex-col font-sans">
      {/* 顶部导航控制台 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">AI 跨平台内容工厂</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
            <PenTool className="w-4 h-4 text-gray-500" />
            <span className="font-medium">AI 润色:</span>
            <select 
              value={polishLevel}
              onChange={(e) => setPolishLevel(e.target.value as PolishLevel)}
              className="bg-transparent border-none outline-none text-gray-800 font-medium cursor-pointer"
            >
              <option value="none">仅排版/转写 (原汁原味)</option>
              <option value="fix">轻度润色 (修错字与语病)</option>
              <option value="rewrite">深度重写 (仿写与逻辑重组)</option>
            </select>
          </div>

          {platform === 'wechat' && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span>当前风格:</span>
              <select 
                value={currentTheme}
                onChange={(e) => {
                  const newTheme = e.target.value as ThemeType;
                  setCurrentThemes(prev => ({ ...prev, [platform]: newTheme }));
                }}
                className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="tech">科技极简风 (Tech)</option>
                <option value="emotion">文艺散文风 (Emotion)</option>
                <option value="news">资讯快报风 (News)</option>
                <option value="vlog">小红书/Vlog风 (Vlog)</option>
              </select>
            </div>
          )}

          <button
            onClick={handleFormat}
            disabled={isProcessing || !inputText.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isProcessing ? '主编处理中...' : '一键生成多平台内容'}
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="bg-red-50 text-red-600 px-6 py-3 border-b border-red-100 text-sm flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-red-400 hover:text-red-700">关闭</button>
        </div>
      )}

      {/* 主工作区：左侧输入，右侧多平台预览 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左半区：写作打稿 */}
        <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
          <div className="p-3 border-b border-gray-100 bg-gray-50/80 text-sm font-medium text-gray-500 flex justify-between">
            <span>📝 请在此处贴入脑暴草稿、大纲或任意文本</span>
            <span className="text-gray-400">{inputText.length} 字</span>
          </div>
          <textarea
            className="flex-1 p-6 resize-none outline-none text-gray-800 leading-relaxed text-[15px]"
            placeholder="例如：今天开了个会，讲了AI排版工具的想法，我觉得特别好，解决了大家不会排版的痛点，只需要粘贴文本，它就能自动提炼金句，甚至还能仿写润色。完全零干预，简直是神器..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>

        {/* 右半区：多平台分发预览 */}
        <div className={`flex flex-col bg-[#F3F4F6] relative ${suggestedImages.length > 0 && (platform === 'wechat' || platform === 'xiaohongshu') ? 'w-1/3 border-r border-gray-200' : 'w-1/2'}`}>
          
          {/* 平台切换 Tab */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setPlatform('wechat')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex justify-center items-center gap-2 ${platform === 'wechat' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <BookOpen className="w-4 h-4" />
              微信公众号 (带配图)
            </button>
            <button
              onClick={() => setPlatform('xiaohongshu')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex justify-center items-center gap-2 ${platform === 'xiaohongshu' ? 'text-red-500 border-b-2 border-red-500 bg-red-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Smartphone className="w-4 h-4" />
              小红书文案
            </button>
            <button
              onClick={() => setPlatform('video_script')}
              className={`flex-1 py-3 px-4 text-sm font-medium flex justify-center items-center gap-2 ${platform === 'video_script' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Video className="w-4 h-4" />
              短视频脚本
            </button>
          </div>

          <div className="p-3 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
            <span className="text-sm font-medium text-gray-600">
              {platform === 'wechat' && '📱 微信排版效果 (附带 AI 自动配图)'}
              {platform === 'xiaohongshu' && '📱 小红书爆款风格'}
              {platform === 'video_script' && '🎬 抖音/视频号分镜脚本'}
            </span>
            <div className="flex items-center gap-2">
              {platform === 'video_script' && htmlOutput && (
                <button 
                  onClick={handleDownloadTeleprompter}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  提词器文本
                </button>
              )}
              <button
                onClick={handleCopy}
                disabled={!htmlOutput || isProcessing}
                className="flex items-center gap-1.5 text-sm bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 px-4 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                <Copy className="w-4 h-4" />
                一键复制结果
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-8 flex justify-center bg-[#F3F4F6] overflow-hidden">
            {/* 动态宽度容器 */}
            <div className={`bg-white shadow-xl w-full h-full rounded-3xl border-4 border-gray-100 overflow-hidden relative flex flex-col ${platform === 'video_script' ? 'max-w-[700px]' : 'max-w-[375px]'}`}>
              {htmlOutput ? (
                platform === 'xiaohongshu' ? (
                  /* 小红书仿真 UI */
                  <div className="flex flex-col h-full bg-white relative pb-14">
                    {/* 顶部用户信息栏 */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 shrink-0 z-10 bg-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-medium text-gray-800">AI排版主编</span>
                      </div>
                      <button className="border border-[#ff2442] text-[#ff2442] px-3 py-1 rounded-full text-xs font-medium">关注</button>
                    </div>
                    
                    {/* 可滚动的主体区域 */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {/* 图片占位/轮播区 */}
                      <div 
                        className="w-full aspect-[3/4] bg-gray-100 relative group flex items-center justify-center overflow-hidden border-b border-gray-50 shrink-0 image-dropzone transition-all"
                        data-id="xiaohongshu_cover"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        {placedImages['xiaohongshu_cover'] || (suggestedImages.length > 0 && suggestedImages[0]?.options?.[0]?.url) ? (
                          <img src={placedImages['xiaohongshu_cover'] || suggestedImages[0].options[0].url} alt="cover" className="w-full h-full object-cover pointer-events-none" />
                        ) : (
                          <div className="text-gray-400 flex flex-col items-center pointer-events-none">
                            <Sparkles className="w-8 h-8 mb-2 text-gray-300" />
                            <span className="text-sm font-medium">小红书首图区</span>
                            <span className="text-xs mt-1 opacity-60">拖拽图片到此处</span>
                          </div>
                        )}
                        {suggestedImages.length > 0 && (
                          <div className="absolute top-4 right-4 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
                            1/{suggestedImages.length}
                          </div>
                        )}
                      </div>

                      {/* 正文内容区 (这是实际要复制的部分) */}
                      <div className="px-4 py-4">
                        <div 
                          ref={previewRef}
                          dangerouslySetInnerHTML={{ __html: htmlOutput }}
                          className="xiaohongshu-render-container outline-none"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        />
                        <div className="text-xs text-gray-400 mt-6 pb-4">今天 12:00</div>
                      </div>
                    </div>

                    {/* 底部互动栏 (绝对定位) */}
                    <div className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-100 flex items-center px-4 justify-between z-10 shrink-0">
                      <div className="flex items-center gap-3 w-1/2">
                        <div className="bg-gray-100 rounded-full px-4 py-1.5 text-sm text-gray-500 w-full">说点什么...</div>
                      </div>
                      <div className="flex items-center gap-4 text-gray-700">
                        <div className="flex items-center gap-1"><span className="text-xl">🤍</span><span className="text-xs">赞</span></div>
                        <div className="flex items-center gap-1"><span className="text-xl">⭐</span><span className="text-xs">收藏</span></div>
                        <div className="flex items-center gap-1"><span className="text-xl">💬</span><span className="text-xs">评论</span></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 微信或视频脚本 UI */
                  <div className="p-5 flex-1 overflow-y-auto">
                    <div 
                      ref={previewRef}
                      dangerouslySetInnerHTML={{ __html: htmlOutput }}
                      className="wechat-render-container"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    />
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 mt-32">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-center px-6 leading-relaxed">
                    在左侧贴入脑暴草稿<br/>
                    选择上方的目标平台后点击<br/>
                    <strong className="text-blue-500 font-normal">「一键生成多平台内容」</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 极右侧：图片推荐画廊 (微信或小红书模式且有推荐图时显示) */}
        {suggestedImages.length > 0 && (platform === 'wechat' || platform === 'xiaohongshu') && (
          <div className="w-1/6 bg-white flex flex-col min-w-[280px] border-l border-gray-200">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-xl">🖼️</span> 智能配图推荐
              </h3>
              <p className="text-xs text-gray-500 mt-1">在文章中找到对应图号，右键保存喜欢的图片插入即可</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-8">
              {suggestedImages.map((group) => (
                <div key={group.id} className="space-y-3 pb-6 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      图 {group.id} 备选
                    </span>
                    <span className="text-xs text-gray-400 font-mono">当前词: "{group.keyword}"</span>
                  </div>

                  {/* 新增：自定义搜图控件 */}
                  <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                    <input 
                      type="text" 
                      placeholder="输入画面描述 (中英文均可)" 
                      className="w-full text-xs p-2 border border-gray-300 rounded mb-2 outline-none focus:border-blue-400"
                      value={customKeywords[group.id] || ''}
                      onChange={(e) => setCustomKeywords(prev => ({ ...prev, [group.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCustomImage(group.id, 'search');
                      }}
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCustomImage(group.id, 'search')}
                        disabled={isSearchingImage[group.id] !== null && isSearchingImage[group.id] !== undefined}
                        className="flex-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {isSearchingImage[group.id] === 'search' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                        搜图库
                      </button>
                      <button 
                        onClick={() => handleCustomImage(group.id, 'generate')}
                        disabled={isSearchingImage[group.id] !== null && isSearchingImage[group.id] !== undefined}
                        className="flex-1 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                        title="调用 AI 根据描述画一张新图"
                      >
                        {isSearchingImage[group.id] === 'generate' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        AI生图
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid gap-3 pt-2">
                    {group.options.map((img: any, idx: number) => (
                      <div key={img.id} className="group relative rounded-md overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
                        <img 
                          src={img.url} 
                          alt={`选项 ${idx + 1}`} 
                          className="w-full h-32 object-cover cursor-grab active:cursor-grabbing"
                          title="拖拽到左侧占位区，或右键另存为"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/uri-list', img.url);
                            e.dataTransfer.setData('text/plain', img.url);
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between">
                          <span>摄影: {img.photographer}</span>
                          <a href={img.page_url} target="_blank" rel="noreferrer" className="text-blue-300 hover:underline">来源</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
