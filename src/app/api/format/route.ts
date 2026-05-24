import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';
import { getWechatPrompt } from './platforms/wechat';
import { getXiaohongshuPrompt } from './platforms/xiaohongshu';
import { getVideoScriptPrompt } from './platforms/videoScript';

/**
 * @file route.ts
 * @description AI 一键多平台格式化排版的核心后端接口，重构支持 Server-Sent Events (SSE) 流式输出。
 *              前端可实现逐字流式渲染，并于流尾端多线程异步并发拉取 Pexels 商业图库配图。
 * @author Antigravity (AI Architect)
 */

interface SuggestedImageOption {
  id: number | string;
  url: string;
  thumb: string;
  photographer: string;
  page_url: string;
}

interface SuggestedImage {
  id: string;
  keyword: string;
  options: SuggestedImageOption[];
}

interface PexelsPhoto {
  id: number;
  src: {
    portrait: string;
    large: string;
    medium: string;
  };
  photographer: string;
  url: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  timeout: 25000,
});

export async function POST(req: Request) {
  try {
    const { text, polishLevel = 'none', platform = 'wechat', customPrompt } = await req.json();

    // 1. 基本安全审计校验与请求频度控制防护
    if (!text || !text.trim()) {
      return NextResponse.json({ error: '请提供需要处理的稿件文本' }, { status: 400 });
    }

    if (text.length > 8000) {
      return NextResponse.json({ error: '输入文本字数超限（最大支持 8000 字）' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: '未配置大模型 API 密钥，请检查环境配置文件' },
        { status: 500 }
      );
    }

    // 2. 根据分发平台定制 AI 系统级 Prompt 指令
    let systemPrompt = '';
    
    if (customPrompt && customPrompt.trim()) {
      // 核心架构师设定：用自定义风格指令起笔，强制追加平台特定的排版及占位语法约束，防止视觉崩塌
      systemPrompt = customPrompt;

      if (platform === 'wechat') {
        systemPrompt += `\n\n【排版输出强制规范】：
1. 自动为文章提取一个吸引人的主标题（放在第一行，使用 #）。
2. 根据内容逻辑分段，提炼小标题（使用 ## 或 ###）。
3. 找出 2-3 句最核心的“金句”或重要结论，进行加粗显示（使用 **文字**）。
4. 如果有引用名言或关键论点，使用引用块（>）。
5. 保持段落简短（每段不超过3-4行）。
6. 【智能配图占位】：在文章合适的位置（如核心段落之间）插入 1-2 个配图占位符。请严格使用这个特殊语法：[IMAGE_PLACEHOLDER: 唯一编号 | 英文搜索关键词] 。唯一编号从1开始递增。关键词必须是能表达该段落意境的英文单词或短语。
   例如：[IMAGE_PLACEHOLDER: 1 | modern technology]
7. 请务必在文章的正文【最末尾】（新起一行）输出该文章推荐的排版风格元数据，格式必须严格如下：
[METADATA: theme=tech|emotion|news|vlog之一]
例如：[METADATA: theme=tech]`;
      } else if (platform === 'xiaohongshu') {
        systemPrompt += `\n\n【排版输出强制规范】：
1. 智能配图占位（首图轮播）：在文案的**最开头**插入 1-3 个配图占位符。请严格使用这个特殊语法：[IMAGE_PLACEHOLDER: 唯一编号 | 英文搜索关键词] 。
2. 吸睛标题（网感第一）：必须包含情绪词汇和 Emoji，使用 # 标记。
3. 【字数硬性限制 - 极其重要】：
   - 标题（# 标记的那一行）：总字符数**绝对不能超过 20 个字符**（含 Emoji 和标点），这是小红书平台的硬性限制，超出会被截断！
   - 正文（不含标题和话题标签）：总字数**必须控制在 1000 字以内**（含标点和 Emoji），这是小红书图文笔记的发布上限。
   - 如果原始草稿内容过长，请精炼提取核心干货，而非全文照搬。
4. 文案结构（总分总），重点加粗（使用 **文字**）。
5. 视觉跳跃：必须大量、合理地穿插 Emoji，每句话说完最好换行。
6. 话题标签：在文章最后必须附带 5-8 个精准的 #话题标签。`;
      } else if (platform === 'video_script') {
        systemPrompt += `\n\n【排版输出强制规范】：
1. 黄金前三秒钩子（Hook）：脚本的开头，必须是一个极具冲击力、悬念或痛点的标题，使用 # 标记。
2. 表格形式：你的核心输出内容**必须是一个标准的 Markdown 表格**，表头必须是：| 分镜/画面建议 | 口播文案 | 音效/字幕 |。
3. 每一行代表视频的一个关键画面切换。
4. 口播文案：极度口语化！短平快，每句话控制在 10 个字以内。
5. 画面建议：要具体到镜头。
6. 结尾：必须有一个强有力的 Call to Action（行动呼吁）。`;
      }

      // 叠加润色要求
      if (polishLevel === 'rewrite') {
        systemPrompt += `\n\n【排版润色等级指令】：请大范围对文章句子进行深度重组 and 深度润色，大幅提高词藻美感及表达流畅度。`;
      } else if (polishLevel === 'fix') {
        systemPrompt += `\n\n【排版润色等级指令】：轻微修正语句语病，订正错别字，保持原有的文章基调。`;
      } else {
        systemPrompt += `\n\n【排版润色等级指令】：尽量保留原文的原汁原味内容，仅做结构化分段排版，不要无端增加或删改核心词意。`;
      }
    } else {
      // 默认情况，使用预置模版
      if (platform === 'wechat') {
        systemPrompt = getWechatPrompt(polishLevel);
      } else if (platform === 'xiaohongshu') {
        systemPrompt = getXiaohongshuPrompt(polishLevel);
      } else if (platform === 'video_script') {
        systemPrompt = getVideoScriptPrompt(polishLevel);
      } else {
        systemPrompt = getWechatPrompt(polishLevel);
      }
    }

    // 3. 调用 OpenAI API，开启 stream: true 流式选项
    const llmStream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();

    // 4. 封装 ReadableStream，构建标准的 Server-Sent Events (SSE) 服务端响应流
    const sseResponseStream = new ReadableStream({
      async start(controller) {
        let fullMarkdownAccumulator = '';

        try {
          // 逐个迭代接收 AI 吐出的数据块 (chunks)
          for await (const chunk of llmStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullMarkdownAccumulator += content;
              
              // 构造标准 SSE 事件帧格式: data: {...}\n\n
              const sseLine = `data: ${JSON.stringify({ type: 'chunk', content })}\n\n`;
              controller.enqueue(encoder.encode(sseLine));
            }
          }

          // === AI 生成完成后的【流收尾】核心逻辑：提取 Metadata 元数据与异步获取 Pexels 配图 ===
          let theme = platform === 'wechat' ? 'tech' : 'neutral';
          let finalCleanMarkdown = fullMarkdownAccumulator;

          // a. 解析尾部推荐的主题风格: [METADATA: theme=xxx]
          const metadataRegex = /\[METADATA:\s*theme=([a-zA-Z]+)\]/i;
          const metadataMatch = finalCleanMarkdown.match(metadataRegex);
          if (metadataMatch) {
            theme = metadataMatch[1].trim();
            // 在最终正文文本中移除此系统级元数据标识，保持用户排版界面的整洁
            finalCleanMarkdown = finalCleanMarkdown.replace(metadataMatch[0], '').trim();
          }

          // b. 智能图片占位符并发搜图检索
          const suggestedImages: SuggestedImage[] = [];
          if ((platform === 'wechat' || platform === 'xiaohongshu') && process.env.PEXELS_API_KEY) {
            // 匹配文案中形如 [IMAGE_PLACEHOLDER: id | keyword] 的占位标签
            const imageRegex = /\[IMAGE_PLACEHOLDER:\s*(\d+)\s*\|\s*(.*?)\]/g;
            const matches = [...finalCleanMarkdown.matchAll(imageRegex)];

            // 并发加速检索：限制前 4 张配图
            const searchPromises = matches.slice(0, 4).map(async (match) => {
              const fullTag = match[0];
              const id = match[1].trim();
              const keyword = match[2].trim();

              // 如果是小红书，正文中的配图直接抹去（因为小红书采用的是顶部轮播封面图逻辑）
              if (platform === 'xiaohongshu') {
                finalCleanMarkdown = finalCleanMarkdown.replace(fullTag, '');
              }

              try {
                const orientation = platform === 'xiaohongshu' ? 'portrait' : 'landscape';
                const pexelsRes = await axios.get(`https://api.pexels.com/v1/search`, {
                  params: {
                    query: keyword,
                    per_page: 4,
                    orientation: orientation,
                  },
                  headers: {
                    Authorization: process.env.PEXELS_API_KEY,
                  },
                  timeout: 8000, // 8秒内响应，防阻塞
                });

                if (pexelsRes.data.photos && pexelsRes.data.photos.length > 0) {
                  suggestedImages.push({
                    id,
                    keyword,
                    options: pexelsRes.data.photos.map((p: PexelsPhoto) => ({
                      id: p.id,
                      url: platform === 'xiaohongshu' ? p.src.portrait : p.src.large,
                      thumb: p.src.medium,
                      photographer: p.photographer,
                      page_url: p.url,
                    })),
                  });
                }
              } catch (imgErr) {
                console.error(`Pexels API Error (Keyword: ${keyword}):`, imgErr);
              }
            });

            // 等待所有异步图片检索结束
            await Promise.all(searchPromises);
          }

          // c. 发送元数据控制事件帧（包含主题风格建议与推荐备选图）
          const metaEvent = `data: ${JSON.stringify({
            type: 'meta',
            theme,
            suggestedImages,
          })}\n\n`;
          controller.enqueue(encoder.encode(metaEvent));

          // d. 发送完成标志帧
          const doneEvent = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
          controller.enqueue(encoder.encode(doneEvent));

        } catch (streamErr: any) {
          console.error('SSE Stream Iterator Error:', streamErr);
          const errorEvent = `data: ${JSON.stringify({
            type: 'error',
            message: streamErr.message || '大模型生成流中途发生异常，请重试。',
          })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
        } finally {
          // 彻底关闭并终止数据流管道
          controller.close();
        }
      },
    });

    // 5. 组装支持流传输的 HTTP Response
    return new Response(sseResponseStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // 禁用 Nginx 等反向代理的缓存，确保即时流式输出
      },
    });

  } catch (error: any) {
    console.error('SSE Route Handler Exception:', error);
    let errMsg = error.message || '服务器内部异常';
    if (error.name === 'APITimeoutError' || errMsg.includes('timeout')) {
      errMsg = 'AI 服务响应超时，请确认大模型节点服务状态并重试。';
    }
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}