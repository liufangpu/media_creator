
# AI 跨平台内容工厂（media_creator）

把任意草稿一键生成「微信公众号排版稿（多主题+配图建议/占位）」「小红书爆款文案」「短视频分镜脚本/提词器文本」，支持 OpenAI 兼容接口、Pexels 图库检索与 AI 生图，复制即发布。

## 关键词（便于检索）

微信公众号排版、公众号排版工具、AI 排版、AI 润色、AI 文案生成、小红书文案、爆款文案、短视频脚本、分镜脚本、提词器、内容工厂、多平台分发、OpenAI 兼容接口、Pexels、FLUX、生图、Next.js、Markdown/HTML 渲染、拖拽配图、一键复制发布

## 功能概览

- 一键生成多平台内容：公众号 / 小红书 / 短视频脚本
- 润色强度可选：仅排版/转写、轻度润色、深度重写
- 公众号主题风格：科技极简 / 文艺散文 / 资讯快报 / Vlog 风
- 自动配图：支持按关键词抓取图库图片，并在正文中提供可拖拽替换的占位区域
- 图片侧边栏：支持「搜图」与「AI 生图」补充素材
- 一键复制发布：复制右侧预览结果，直接粘贴到对应平台后台
- 短视频提词器：可从脚本一键导出提词器 TXT

## 快速开始

1) 安装依赖

```bash
npm install
```

2) 配置环境变量（见下方“环境变量配置”）

3) 启动开发服务

```bash
npm run dev
```

打开浏览器访问：`http://localhost:3000`

## 环境变量配置（.env.local）

项目会读取根目录下的 `.env.local`。仓库提供了示例文件 `.env.example`，推荐做法是复制一份再填写你自己的 Key：

```bash
copy .env.example .env.local
```

`.env.local` 已在 `.gitignore` 中忽略，请不要把真实 Key 提交到 Git 仓库。

### 必填

- `OPENAI_API_KEY`：你的 OpenAI Key（或第三方 OpenAI 兼容服务的 Key）

### 可选（使用第三方 OpenAI 兼容服务时常用）

- `OPENAI_BASE_URL`：OpenAI 兼容接口 Base URL  
  - 例如：豆包（火山引擎）/ DeepSeek / 硅基流动等都可能需要替换为它们各自的地址
- `OPENAI_MODEL`：模型名称（按服务商填写对应模型 ID/名称）

### 可选（配图能力）

- `PEXELS_API_KEY`：Pexels 图库 API Key  
  - 配置后：公众号/小红书会按 AI 给出的关键词抓取真实高清图库图片，用于侧边栏候选图与正文配图建议

### 可选（AI 生图能力）

- `SILICONFLOW_API_KEY`：SiliconFlow 硅基流动 Key  
  - 配置后：右侧侧边栏的“AI 生图”能力可用（通常用于生成更匹配语境的配图）
