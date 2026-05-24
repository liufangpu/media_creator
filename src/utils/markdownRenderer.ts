import { marked } from 'marked';

// 定义不同主题的 CSS 内联样式字典
const themes = {
  tech: {
    h1: 'font-size: 22px; font-weight: bold; color: #0f172a; margin: 40px 0 20px; padding-bottom: 12px; border-bottom: 2px solid #3b82f6; text-align: left; line-height: 1.5; letter-spacing: 1px;',
    h2: 'font-size: 18px; font-weight: bold; color: #1e40af; margin: 32px 0 16px; padding: 8px 12px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 0 4px 4px 0; line-height: 1.4;',
    h3: 'font-size: 16px; font-weight: bold; color: #1e3a8a; margin: 24px 0 12px; display: inline-block; border-bottom: 2px solid #bfdbfe; padding-bottom: 4px; line-height: 1.4;',
    p: 'font-size: 15px; color: #334155; line-height: 1.8; margin-bottom: 18px; letter-spacing: 0.5px; text-align: justify;',
    strong: 'font-weight: bold; color: #1d4ed8; background: linear-gradient(transparent 60%, #bfdbfe 40%); padding: 0 2px;',
    blockquote: 'padding: 16px 20px; margin: 24px 0; border-left: 4px solid #60a5fa; background-color: #f8fafc; color: #475569; font-size: 14px; line-height: 1.7; border-radius: 0 8px 8px 0;',
    ul: 'padding-left: 24px; margin-bottom: 20px; color: #334155; font-size: 15px; line-height: 1.8;',
    li: 'margin-bottom: 10px; padding-left: 4px;',
  },
  emotion: {
    h1: 'font-size: 20px; font-weight: normal; color: #451a03; margin: 50px 0 30px; text-align: center; letter-spacing: 4px; line-height: 1.6; border-top: 1px solid #d4d4d8; border-bottom: 1px solid #d4d4d8; padding: 16px 0;',
    h2: 'font-size: 17px; font-weight: bold; color: #78350f; margin: 40px 0 20px; text-align: center; line-height: 1.6; letter-spacing: 2px;',
    h3: 'font-size: 15px; font-weight: bold; color: #92400e; margin: 24px 0 12px; text-align: center; line-height: 1.6;',
    p: 'font-size: 15px; color: #52525b; line-height: 2.2; margin-bottom: 28px; letter-spacing: 1.2px; text-align: justify;',
    strong: 'font-weight: bold; color: #78350f; border-bottom: 1px dashed #92400e; padding-bottom: 2px;',
    blockquote: 'padding: 20px; margin: 32px 0; background-color: #fafaf9; color: #713f12; font-size: 14px; line-height: 2.0; text-align: center; border-top: 1px solid #e7e5e4; border-bottom: 1px solid #e7e5e4; font-style: italic;',
    ul: 'padding-left: 0; margin-bottom: 28px; color: #52525b; font-size: 15px; line-height: 2.2; list-style-type: none;',
    li: 'margin-bottom: 12px; position: relative; padding-left: 20px; &::before { content: "·"; position: absolute; left: 0; color: #92400e; }',
  },
  news: {
    h1: 'font-size: 24px; font-weight: 900; color: #991b1b; margin: 30px 0 20px; text-align: left; line-height: 1.4;',
    h2: 'font-size: 18px; font-weight: bold; color: #ffffff; background-color: #dc2626; margin: 32px 0 16px; padding: 6px 12px; display: inline-block; border-radius: 4px; line-height: 1.4;',
    h3: 'font-size: 16px; font-weight: bold; color: #b91c1c; margin: 20px 0 12px; line-height: 1.4;',
    p: 'font-size: 16px; color: #1f2937; line-height: 1.7; margin-bottom: 16px; text-align: justify;',
    strong: 'font-weight: 900; color: #991b1b;',
    blockquote: 'padding: 16px; margin: 20px 0; background-color: #fef2f2; color: #7f1d1d; font-size: 15px; line-height: 1.6; border-left: 6px solid #ef4444; font-weight: bold;',
    ul: 'padding-left: 24px; margin-bottom: 16px; color: #1f2937; font-size: 16px; line-height: 1.7;',
    li: 'margin-bottom: 8px;',
  },
  vlog: {
    h1: 'font-size: 22px; font-weight: 900; color: #111827; margin: 30px 0 20px; text-align: center; background: linear-gradient(90deg, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;',
    h2: 'font-size: 17px; font-weight: 800; color: #111827; margin: 30px 0 16px; padding: 10px 16px; background-color: #fce7f3; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(236, 72, 153, 0.1);',
    h3: 'font-size: 15px; font-weight: bold; color: #db2777; margin: 20px 0 12px;',
    p: 'font-size: 15px; color: #4b5563; line-height: 1.8; margin-bottom: 16px;',
    strong: 'font-weight: 800; color: #be185d; background-color: #fdf2f8; padding: 2px 6px; border-radius: 4px;',
    blockquote: 'padding: 16px; margin: 20px 0; background: linear-gradient(135deg, #fdf2f8, #f5f3ff); color: #831843; font-size: 14px; line-height: 1.7; border-radius: 12px;',
    ul: 'padding-left: 24px; margin-bottom: 16px; color: #4b5563; font-size: 15px; line-height: 1.8;',
    li: 'margin-bottom: 8px;',
  },
  neutral: {
    // 通用样式，用于短视频脚本的预览
    h1: 'font-size: 18px; font-weight: bold; color: #111827; margin-top: 20px; margin-bottom: 12px;',
    h2: 'font-size: 16px; font-weight: bold; color: #1f2937; margin-top: 16px; margin-bottom: 10px;',
    h3: 'font-size: 15px; font-weight: bold; color: #374151; margin-top: 14px; margin-bottom: 8px;',
    p: 'font-size: 15px; color: #374151; line-height: 1.6; margin-bottom: 12px;',
    strong: 'font-weight: bold; color: #111827;',
    blockquote: 'padding: 10px 15px; margin: 16px 0; border-left: 4px solid #d1d5db; background-color: #f9fafb; color: #4b5563;',
    ul: 'padding-left: 20px; margin-bottom: 16px; color: #374151;',
    li: 'margin-bottom: 6px;',
  },
  xiaohongshu: {
    // 深度定制：完全模拟小红书 App 真实的笔记排版视觉
    h1: 'font-size: 20px; font-weight: 700; color: #333333; margin-bottom: 16px; line-height: 1.4; letter-spacing: 0.5px;',
    h2: 'font-size: 16px; font-weight: bold; color: #333333; margin-top: 16px; margin-bottom: 8px;',
    h3: 'font-size: 15px; font-weight: bold; color: #333333; margin-top: 12px; margin-bottom: 8px;',
    p: 'font-size: 15px; color: #333333; line-height: 1.7; margin-bottom: 12px; letter-spacing: 0.5px; white-space: pre-wrap;',
    strong: 'font-weight: bold; color: #333333;',
    blockquote: 'color: #333333; font-size: 15px; line-height: 1.7;', // 小红书没有引用块，强行抹平样式
    ul: 'padding-left: 0; list-style-type: none; color: #333333; font-size: 15px; line-height: 1.7;',
    li: 'margin-bottom: 8px;',
  }
};

export type ThemeType = keyof typeof themes;

export const parseMarkdown = (markdown: string, theme: ThemeType = 'tech', placedImages?: Record<string, string>): string => {
  const currentStyles = themes[theme] || themes.neutral;
  
  // --- 1. 暂存所有的图片占位符 ---
  // 避免里面的文本被后续的正则误伤，也避免生成的 HTML 颜色代码被后续正则匹配
  const placeholders: string[] = [];
  let cleanMarkdown = markdown.replace(/\[IMAGE_PLACEHOLDER:\s*(\d+)\s*\|\s*(.*?)\]/g, (match) => {
    placeholders.push(match);
    return `___IMG_PLACEHOLDER_${placeholders.length - 1}___`;
  });

  // --- 2. 核心清洗：还原转义的星号，去掉多余空格 ---
  cleanMarkdown = cleanMarkdown
    .replace(/\\+\*/g, '*') 
    .replace(/\*\*\s+(.*?)\s+\*\*/g, '**$1**');

  // --- 3. 小红书专属优化：处理话题标签变蓝 ---
  // 此时文本是纯净的 Markdown，没有任何注入的 style 颜色代码
  // 严格限制话题字符为中文、字母、数字、下划线，避免误伤
  if (theme === 'xiaohongshu') {
    cleanMarkdown = cleanMarkdown.replace(/(^|[^#&])(#[\p{L}\p{N}_]+)/gu, '$1<span style="color: #135bb5; cursor: pointer; margin-right: 4px;">$2</span>');
  }

  // --- 4. 终极必杀技：提前把所有的 **文字** 替换为 HTML 标签 ---
  cleanMarkdown = cleanMarkdown.replace(/\*\*(.*?)\*\*/g, (match, p1) => `<strong style="${currentStyles.strong}">${p1.trim()}</strong>`);

  // --- 5. 还原图片占位符并转换为可拖拽区域或已放置的图片 ---
  cleanMarkdown = cleanMarkdown.replace(/___IMG_PLACEHOLDER_(\d+)___/g, (match, index) => {
    const original = placeholders[parseInt(index, 10)];
    return original.replace(/\[IMAGE_PLACEHOLDER:\s*(\d+)\s*\|\s*(.*?)\]/g, (m, id, keyword) => {
      const safeKeyword = keyword.replace(/"/g, '&quot;'); // 防止破坏 HTML
      if (placedImages && placedImages[id]) {
        return `\n\n<div class="image-dropzone" data-id="${id}" style="text-align: center; margin: 24px 0; position: relative; cursor: pointer; transition: all 0.3s; border: 2px dashed transparent; border-radius: 8px;" title="拖拽新图片到此处替换">
  <img src="${placedImages[id]}" alt="${safeKeyword}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: inline-block; pointer-events: none;" />
</div>\n\n`;
      } else {
        return `\n\n<div class="image-dropzone" data-id="${id}" style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; color: #64748b; font-size: 14px; cursor: pointer; transition: all 0.3s;">
  <span style="display: block; font-size: 24px; margin-bottom: 8px; pointer-events: none;">🖼️</span>
  <strong style="pointer-events: none;">图 ${id}</strong> <span style="pointer-events: none;">预留位</span><br/>
  <span style="font-size: 12px; opacity: 0.8; pointer-events: none;">(拖拽右侧图片或本地图片到此处)</span>
</div>\n\n`;
      }
    });
  });

  // --- 5.5 标题格式标准化预处理 ---
  // 修复 AI 输出的非标准 Markdown 标题格式，确保 marked 能正确解析
  // 场景1: "#标题" → "# 标题"（缺少空格）
  // 场景2: "# #标题" → "# 标题"（多余的 # 号）
  // 场景3: "## ##标题" → "## 标题"（小标题也可能出现类似问题）
  cleanMarkdown = cleanMarkdown.replace(/^(#{1,6})\s*#*\s*(?!#)/gm, '$1 ');

  // 先用原生的 marked 渲染出最干净的 HTML
  let rawHtml = marked.parse(cleanMarkdown) as string;

  // --- 后处理：清除 marked 遗漏的孤立 # 号 ---
  // 如果 AI 在正文中输出了独立的 # 符号（不是标题，也不是话题标签）
  // 在最终 HTML 中移除段落开头的残留 # 号
  rawHtml = rawHtml.replace(/(<(?:p|h[1-6])[^>]*>)\s*#{1,6}\s+/g, '$1');

  // 后处理：替换各个标签，注入我们在 themes 字典里写好的内联样式
  // 替换段落 <p>
  rawHtml = rawHtml.replace(/<p(.*?)>/g, `<p style="${currentStyles.p}"$1>`);
  
  // 替换各级标题 <h1/2/3>
  rawHtml = rawHtml.replace(/<h1(.*?)>/g, `<h1 style="${currentStyles.h1}"$1>`);
  rawHtml = rawHtml.replace(/<h2(.*?)>/g, `<h2 style="${currentStyles.h2}"$1>`);
  rawHtml = rawHtml.replace(/<h3(.*?)>/g, `<h3 style="${currentStyles.h3}"$1>`);
  
  // 替换加粗 <strong>
  rawHtml = rawHtml.replace(/<strong>/g, `<strong style="${currentStyles.strong}">`);
  
  // 替换引用 <blockquote>
  rawHtml = rawHtml.replace(/<blockquote>/g, `<blockquote style="${currentStyles.blockquote}">`);
  
  // 替换列表 <ul>, <ol>, <li>
  rawHtml = rawHtml.replace(/<ul>/g, `<ul style="${currentStyles.ul}">`);
  rawHtml = rawHtml.replace(/<ol>/g, `<ol style="${currentStyles.ul}">`);
  rawHtml = rawHtml.replace(/<li>/g, `<li style="${currentStyles.li}">`);
  
  // 替换图片，添加居中和边框样式
  rawHtml = rawHtml.replace(/<img (.*?)>/g, (match, attrs) => {
    return `<div style="text-align: center; margin: 24px 0;">
      <img ${attrs} style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: inline-block;" />
    </div>`;
  });

  return rawHtml;
};

// ==========================================
// 核心更新：为短视频脚本提供【完全独立】的渲染器
// 不再依赖 marked 的 AST 解析，直接利用正则处理 Markdown 表格
// 彻底解决 [object Object] 的问题
// ==========================================
export const parseVideoScript = (markdown: string): string => {
  if (!markdown) return '';
  
  // 1. 处理短视频的标题（通常是 # 标题）
  let html = markdown.replace(/^#\s+(.*)$/gm, '<h1 style="font-size: 18px; font-weight: bold; color: #111827; margin: 20px 0 16px; text-align: center;">$1</h1>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 16px 0 12px; text-align: center;">$1</h2>');

  // 2. 提取出所有的 Markdown 表格行
  const lines = html.split('\n');
  let inTable = false;
  let tableHtml = '';
  const finalLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 如果这一行是表格分割线（比如 |---|---|）则跳过
    if (/^\|[-:| ]+\|$/.test(line) || /^[-:| ]+$/.test(line)) {
      continue;
    }

    // 如果这一行是表格内容（以 | 开头并以 | 结尾）
    if (line.startsWith('|') && line.endsWith('|')) {
      // 提取所有单元格内容
      const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
      
      if (!inTable) {
        // 这是表格的第一行（表头）
        inTable = true;
        tableHtml += `<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; text-align: left; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
          <thead style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
            <tr>`;
        cells.forEach(cell => {
          tableHtml += `<th style="padding: 12px 16px; font-weight: bold; color: #374151;">${cell}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;
      } else {
        // 这是表格的主体数据行
        tableHtml += `<tr style="border-bottom: 1px solid #f3f4f6; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f9fafb'" onmouseout="this.style.backgroundColor='transparent'">`;
        cells.forEach((cell, index) => {
          // 对第二列（通常是口播文案）进行加粗放大处理
          const isMainText = index === 1;
          const cellStyle = isMainText 
            ? 'padding: 16px; font-weight: 600; color: #111827; font-size: 15px; line-height: 1.6;' 
            : 'padding: 16px; color: #4b5563; line-height: 1.5;';
          tableHtml += `<td style="${cellStyle}">${cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>`;
        });
        tableHtml += `</tr>`;
      }
    } else {
      // 退出表格区域
      if (inTable) {
        tableHtml += `</tbody></table>`;
        finalLines.push(tableHtml);
        tableHtml = '';
        inTable = false;
      }
      
      // 处理普通的非表格文本（比如开场白或者结尾的话）
      if (line && !line.startsWith('<h')) {
        finalLines.push(`<p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 12px;">${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`);
      } else if (line) {
        finalLines.push(line); // 标题已经带 HTML 了
      }
    }
  }

  // 如果表格在文档末尾
  if (inTable) {
    tableHtml += `</tbody></table>`;
    finalLines.push(tableHtml);
  }

  return finalLines.join('\n');
};
