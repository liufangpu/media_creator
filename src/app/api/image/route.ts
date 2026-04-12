import { NextResponse } from 'next/server';
import axios from 'axios';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function POST(req: Request) {
  try {
    const { keyword, type = 'search' } = await req.json();

    if (!keyword) {
      return NextResponse.json({ error: '请输入关键词' }, { status: 400 });
    }

    if (type === 'search') {
      // 1. 图库搜索模式 (Pexels)
      if (!process.env.PEXELS_API_KEY) {
        return NextResponse.json({ error: '未配置 Pexels API Key' }, { status: 500 });
      }

      // 如果用户输入了中文，我们先让大模型翻译成英文，以提高 Pexels 的检索准确率
      let searchKeyword = keyword;
      if (/[\u4e00-\u9fa5]/.test(keyword)) {
         const transRes = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: `Translate this keyword to English for image search. Only output the English word/phrase, nothing else: ${keyword}` }],
            temperature: 0.3,
         });
         searchKeyword = transRes.choices[0]?.message?.content?.trim() || keyword;
      }

      const pexelsRes = await axios.get(`https://api.pexels.com/v1/search`, {
        params: { query: searchKeyword, per_page: 4, orientation: 'landscape' },
        headers: { Authorization: process.env.PEXELS_API_KEY }
      });

      if (pexelsRes.data.photos && pexelsRes.data.photos.length > 0) {
        const options = pexelsRes.data.photos.map((p: any) => ({
          id: p.id,
          url: p.src.large,
          thumb: p.src.medium,
          photographer: p.photographer,
          page_url: p.url
        }));
        return NextResponse.json({ options });
      } else {
        return NextResponse.json({ error: '图库中未找到相关图片，换个词试试？' }, { status: 404 });
      }

    } else if (type === 'generate') {
      // 2. AI 高清生图模式 (使用硅基流动 SiliconFlow 的快手可灵 Kolors 模型)
      if (!process.env.SILICONFLOW_API_KEY) {
        return NextResponse.json({ error: '未配置 SiliconFlow API Key，无法使用高质量生图' }, { status: 500 });
      }

      // 让大模型充当 Prompt 工程师，将用户的简短描述扩写为高质量的画面描述
      // 注意：Kolors 对中文理解极好，所以我们直接让大模型输出高质量的中文提示词即可！
      const promptRes = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [{ 
            role: 'system', 
            content: '你是一个专业的 AI 绘画提示词（Prompt）专家。用户会给你一个简单的画面想法，你需要将其扩写为一段极其详细、具有电影级质感的高质量中文画面描述。包含光影、视角、画风、氛围等细节。只输出最终的中文提示词，不要有任何废话。'
        }, { 
            role: 'user', 
            content: keyword 
        }],
        temperature: 0.7,
      });

      const enhancedPrompt = promptRes.choices[0]?.message?.content?.trim() || keyword;
      
      // 调用硅基流动的官方 API，使用快手可灵 (Kwai-Kolors/Kolors) 模型
      const sfRes = await axios.post(
        'https://api.siliconflow.cn/v1/images/generations',
        {
          model: 'Kwai-Kolors/Kolors', 
          prompt: enhancedPrompt,
          image_size: '1024x576', // 16:9 横屏，适合公众号/视频封面
          batch_size: 1,
          num_inference_steps: 20 // Kolors 推荐使用 20 步以获得极高画质
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (sfRes.data && sfRes.data.images && sfRes.data.images.length > 0) {
        const imageUrl = sfRes.data.images[0].url;
        return NextResponse.json({ 
          options: [{
            id: `ai_${Date.now()}`,
            url: imageUrl,
            thumb: imageUrl,
            photographer: 'Kolors AI 魔法生成',
            page_url: imageUrl
          }] 
        });
      } else {
        throw new Error('硅基流动生图 API 未返回有效图片');
      }
    }

    return NextResponse.json({ error: '未知的请求类型' }, { status: 400 });

  } catch (error: any) {
    console.error('搜图/生图 API 报错:', error);
    return NextResponse.json({ error: error.message || '内部服务器错误' }, { status: 500 });
  }
}
