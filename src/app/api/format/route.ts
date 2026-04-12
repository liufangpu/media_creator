import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';
import { getWechatPrompt } from './platforms/wechat';
import { getXiaohongshuPrompt } from './platforms/xiaohongshu';
import { getVideoScriptPrompt } from './platforms/videoScript';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function POST(req: Request) {
  try {
    // 新增了 platform 字段，默认处理为 wechat
    const { text, polishLevel = 'none', platform = 'wechat' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: '请提供需要处理的纯文本' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: '请在项目根目录创建 .env.local 文件并配置 OPENAI_API_KEY' }, { status: 500 });
    }

    // 针对不同的分发平台，调用各自独立的 Prompt 构建器
    let systemPrompt = '';
    if (platform === 'wechat') {
      systemPrompt = getWechatPrompt(polishLevel);
    } else if (platform === 'xiaohongshu') {
      systemPrompt = getXiaohongshuPrompt(polishLevel);
    } else if (platform === 'video_script') {
      systemPrompt = getVideoScriptPrompt(polishLevel);
    } else {
      systemPrompt = getWechatPrompt(polishLevel); // 默认降级
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.7,
    });

    let resultStr = response.choices[0]?.message?.content;
    
    // =====================================
    // 增加调试日志：将 AI 返回的最原始字符串写入本地文件
    // =====================================
    const fs = require('fs');
    const path = require('path');
    try {
      const debugLogPath = path.join(process.cwd(), `ai_debug_log_${platform}.txt`);
      fs.writeFileSync(debugLogPath, `[TIME] ${new Date().toISOString()}\n[RAW OUTPUT]\n${resultStr}\n\n=========================================\n\n`, { flag: 'a' });
      console.log(`已将 ${platform} 的原始输出写入调试文件：${debugLogPath}`);
    } catch (err) {
      console.error('写入调试日志失败', err);
    }

    if (!resultStr) {
      throw new Error('AI 返回了空结果');
    }

    let result: { theme?: string; markdown: string } = { theme: 'neutral', markdown: '' };

    // 如果是短视频脚本，直接将返回结果作为 Markdown 处理，不需要解析 JSON
    if (platform === 'video_script') {
      resultStr = resultStr.trim();
      // 如果 AI 画蛇添足地加了 Markdown 代码块标记，去掉它
      if (resultStr.startsWith('```markdown')) {
        const match = resultStr.match(/```markdown([\s\S]*?)```/);
        if (match) resultStr = match[1].trim();
      } else if (resultStr.startsWith('```')) {
        const match = resultStr.match(/```([\s\S]*?)```/);
        if (match) resultStr = match[1].trim();
      }
      result.markdown = resultStr;
    } else {
      // 微信和小红书仍然使用 JSON 格式解析
      // 正则容错解析 JSON
      resultStr = resultStr.trim();
      if (resultStr.startsWith('```')) {
        const match = resultStr.match(/```(?:json)?([\s\S]*?)```/);
        if (match) {
          resultStr = match[1].trim();
        }
      }

      // 清洗 JSON 字符串中的非法控制字符（特别是大模型经常输出真实的换行符导致解析崩溃）
      // 1. 将真实的换行符替换为转义的 \\n
      resultStr = resultStr.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
      
      // 2. 但是，这样会把 JSON 本身的结构换行也给转义掉，导致无法解析。
      // 更稳妥的方法是：只清洗 JSON 字符串值（双引号内部）的非法换行。
      // 这里我们使用一个更粗暴但有效的补救方案：如果上面的 replace 破坏了结构，我们尝试用正则只修复双引号内部的换行。
      // 为了简单且兼容性强，我们先直接解析，如果报错再尝试清洗。
      try {
        // 恢复上面错误的全局 replace
        let cleanStr = response.choices[0]?.message?.content || '';
        cleanStr = cleanStr.trim();
        if (cleanStr.startsWith('```')) {
          const match = cleanStr.match(/```(?:json)?([\s\S]*?)```/);
          if (match) cleanStr = match[1].trim();
        }
        
        // 专门处理 JSON 字符串内部的换行符和控制字符（0x00-0x1F）
        // 这个正则匹配所有的控制字符，除了制表符和换行符（我们希望保留它们，但以转义形式）
        cleanStr = cleanStr.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');
        
        result = JSON.parse(cleanStr);
      } catch (e) {
        console.warn('JSON Parse failed, attempting fallback repair...');
        
        // 尝试更智能的清洗：找到 "markdown": " 之后，一直到 "} 之前的内容，把里面的换行转义
        let rawText = response.choices[0]?.message?.content || '';
        let markdownContentMatch = rawText.match(/"markdown"\s*:\s*"([\s\S]*?)"\s*}/);
        if (markdownContentMatch) {
           let mdContent = markdownContentMatch[1];
           // 将真实的换行替换为 \n
           mdContent = mdContent.replace(/\n/g, '\\n').replace(/\r/g, '');
           // 将未转义的双引号替换为单引号或转义的双引号（非常容易出错的地方）
           mdContent = mdContent.replace(/"/g, '\\"');
           
           // 尝试重新拼装 JSON
           let themeMatch = rawText.match(/"theme"\s*:\s*"([^"]*)"/);
           let theme = themeMatch ? themeMatch[1] : (platform === 'wechat' ? 'tech' : 'neutral');
           
           result = { theme, markdown: mdContent.replace(/\\\\n/g, '\n').replace(/\\"/g, '"') }; // 还原以便前端使用
        } else {
          throw new Error('AI 返回的数据格式严重损坏，无法解析。请重试。');
        }
      }
    }
    
    // --- 核心更新：后端截获占位符，真正去调用商业图库 API ---
    let finalMarkdown = result.markdown || text;
    let suggestedImages: Array<{ id: string, keyword: string, options: any[] }> = [];
    
    // 微信公众号和小红书都支持自动配图推荐
    if ((platform === 'wechat' || platform === 'xiaohongshu') && process.env.PEXELS_API_KEY) {
      // 找到所有的 [IMAGE_PLACEHOLDER: id | keyword]
      const imageRegex = /\[IMAGE_PLACEHOLDER:\s*(\d+)\s*\|\s*(.*?)\]/g;
      const matches = [...finalMarkdown.matchAll(imageRegex)];
      
      for (const match of matches) {
        const fullTag = match[0];
        const id = match[1].trim();
        const keyword = match[2].trim();
        
        // 小红书正文里不应该有图片占位符，因为图片都在顶部轮播。这里直接移除。
        if (platform === 'xiaohongshu') {
          finalMarkdown = finalMarkdown.replace(fullTag, '');
        }
        // 对于微信公众号，我们保留原始的 [IMAGE_PLACEHOLDER: id | keyword] 标签，
        // 交由前端 markdownRenderer.ts 在渲染时转换为可拖拽的 Dropzone HTML。

        try {
          // 调用 Pexels，微信用横版(landscape)，小红书用竖版(portrait)
          const orientation = platform === 'xiaohongshu' ? 'portrait' : 'landscape';
          const pexelsRes = await axios.get(`https://api.pexels.com/v1/search`, {
            params: {
              query: keyword,
              per_page: 4,
              orientation: orientation,
            },
            headers: {
              Authorization: process.env.PEXELS_API_KEY
            }
          });
          
          if (pexelsRes.data.photos && pexelsRes.data.photos.length > 0) {
            suggestedImages.push({
              id,
              keyword,
              options: pexelsRes.data.photos.map((p: any) => ({
                id: p.id,
                url: platform === 'xiaohongshu' ? p.src.portrait : p.src.large, // 小红书用竖屏专用链接
                thumb: p.src.medium,
                photographer: p.photographer,
                page_url: p.url
              }))
            });
          }
        } catch (imgErr) {
          console.error(`Pexels 图片搜索失败 (关键词: ${keyword}):`, imgErr);
        }
      }
    } else if (platform === 'wechat' || platform === 'xiaohongshu') {
        if (platform === 'xiaohongshu') {
          finalMarkdown = finalMarkdown.replace(/\[IMAGE_PLACEHOLDER:\s*(\d+)\s*\|\s*(.*?)\]/g, '');
        }
        // 对于微信公众号，如果没有配置 API Key，同样保留原始标签，交给前端渲染可拖拽的占位符
    }
    
    return NextResponse.json({
      theme: result.theme || (platform === 'wechat' ? 'tech' : 'neutral'),
      markdown: finalMarkdown,
      suggestedImages: suggestedImages, // 返回给前端渲染独立画廊
    });
    
  } catch (error: any) {
    console.error('AI 引擎报错:', error);
    return NextResponse.json({ error: error.message || '内部服务器错误' }, { status: 500 });
  }
}
