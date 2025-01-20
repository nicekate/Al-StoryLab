# AI-StoryLab

AI-StoryLab 是一个基于 Next.js 开发的智能故事创作平台，它能够帮助用户生成故事并添加音频效果，让故事更加生动有趣。同时支持生成配套的绘图提示词，方便用户使用 Stable Diffusion 等 AI 绘图工具创建插图。

## 主要功能

- **故事生成**：根据主题自动生成故事内容
- **语音合成**：支持中英文语音生成
  - 中文：使用 海螺 MiniMax 语音服务
  - 英文：使用 Replicate Kokoro 语音服务
- **音效生成**：使用 ElevenLabs 生成逼真的音效
- **智能建议**：自动推荐合适的音效位置
- **绘图提示词**：为故事场景自动生成 AI 绘图提示词
- **导出功能**：
  - 导出音效位置指南
  - 导出绘图提示词

## 技术栈

- **框架**：Next.js 14
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **UI组件**：shadcn/ui (基于 Radix UI 的组件库)
- **AI服务**：
  - DeepSeek：故事生成和绘图提示词生成
  - MiniMax：中文语音
  - Kokoro：英文语音
  - ElevenLabs：音效生成

## 开始使用

1. 克隆项目
```bash
git clone https://github.com/nicekate/Al-StoryLab.git
cd Al-StoryLab
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
复制 `.env.example` 文件并重命名为 `.env.local`，填入必要的 API 密钥：

需要在以下平台注册并获取 API 密钥：
- DeepSeek API Key ([获取地址](https://api-docs.deepseek.com/zh-cn/))
- MiniMax API Key 和 Group ID ([获取地址](https://platform.minimaxi.com/))
- ElevenLabs API Key ([获取地址](https://elevenlabs.io))
- Replicate API Token ([获取地址](https://replicate.com/))

将获取的密钥填入 `.env.local`：
- DEEPSEEK_API_KEY
- MINIMAX_API_KEY
- MINIMAX_GROUP_ID
- ELEVENLABS_API_KEY
- REPLICATE_API_TOKEN

4. 启动开发服务器
```bash
npm run dev
```

5. 访问 [http://localhost:3000](http://localhost:3000) 开始使用

## 使用指南

### 生成故事
1. 输入故事主题或使用自动生成的提示
2. 选择语言（中文/英文）
3. 点击生成按钮

### 添加音效
1. 使用智能建议生成音效提示词
2. 选择合适的音效位置
3. 点击生成音效

### 生成绘图提示词
1. 在故事生成后，点击"生成绘图提示词"
2. 系统会为每个关键场景生成 AI 绘图提示词
3. 可以直接复制使用或导出保存

## 许可证

MIT