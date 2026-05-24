/**
 * @file index.ts
 * @description 全局 TypeScript 类型定义文件，遵循 Google 编程规范，包含项目核心数据结构与接口。
 * @author Antigravity (AI Architect)
 */

/**
 * 平台类型
 * - 'wechat': 微信公众号
 * - 'xiaohongshu': 小红书文案
 * - 'video_script': 短视频分镜脚本
 */
export type PlatformType = 'wechat' | 'xiaohongshu' | 'video_script';

/**
 * AI 润色级别
 * - 'none': 仅排版/转写，保留原始内容
 * - 'fix': 轻度润色，修饰错别字与语病
 * - 'rewrite': 深度重写，进行仿写与逻辑重组
 */
export type PolishLevel = 'none' | 'fix' | 'rewrite';

/**
 * 微信公众号排版主题风格类型
 * - 'tech': 科技极简风 (Tech)
 * - 'emotion': 文艺散文风 (Emotion)
 * - 'news': 资讯快报风 (News)
 * - 'vlog': 小红书/Vlog风 (Vlog)
 * - 'neutral': 中性/无特定风格
 */
export type ThemeType = 'tech' | 'emotion' | 'news' | 'vlog' | 'neutral';

/**
 * 智能推荐配图的单个图片选项接口
 */
export interface SuggestedImageOption {
  /** 图片唯一标识符 */
  id: string | number;
  /** 适合展示的高清/大图 URL */
  url: string;
  /** 适合列表展示的缩略图 URL */
  thumb: string;
  /** 摄影师姓名/AI生成标识 */
  photographer: string;
  /** 原始图片详情页链接 */
  page_url: string;
}

/**
 * 智能推荐配图组接口
 */
export interface SuggestedImage {
  /** 占位符 ID，与 markdown 中的 [IMAGE_PLACEHOLDER: id | keyword] 对应 */
  id: string;
  /** 图片搜索建议关键词 */
  keyword: string;
  /** 候选图片选项数组 */
  options: SuggestedImageOption[];
}

/**
 * 自定义 Prompt 模板数据接口 (第三阶段预留)
 */
export interface PromptTemplate {
  /** 模板唯一标识 */
  id: string;
  /** 模板名称 */
  name: string;
  /** 展示图标 (Emoji) */
  icon: string;
  /** 模板描述信息 */
  description: string;
  /** 模板类别：内置或自定义 */
  category: 'builtin' | 'custom';
  /** 适用平台列表 */
  platforms: PlatformType[];
  /** 核心系统 Prompt */
  systemPrompt: string;
  /** 润色级别对应的额外微调 Prompt */
  polishPresets?: {
    none?: string;
    fix?: string;
    rewrite?: string;
  };
}
