import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { topic, language = 'en' } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: language === 'zh' ? "主题不能为空" : "Topic cannot be empty" },
        { status: 400 }
      );
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: language === 'zh' ? "缺少 DEEPSEEK_API_KEY" : "Missing DEEPSEEK_API_KEY" },
        { status: 500 }
      );
    }

    const prompt = language === 'zh' 
      ? `根据主题"${topic}"写一个短故事。要求：
        1. 用简体中文写作
        2. 不要使用特殊字符、星号或markdown格式
        3. 故事要有趣且富有想象力
        4. 保持在200-300字之间
        5. 分成3-4个自然段落
        6. 使用简单明了的语言
        7. 避免使用括号、方括号或任何可能影响文本转语音的符号`
      : `Write a short story based on the topic "${topic}". Requirements:
        1. Write the story in English using only regular letters and basic punctuation
        2. Do not use any special characters, asterisks, or markdown formatting
        3. Make it interesting and imaginative
        4. Keep it between 200-300 words
        5. Divide it into 3-4 natural paragraphs
        6. Use simple and clear language
        7. Avoid using parentheses, brackets, or any symbols that might interfere with text-to-speech`;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const story = data.choices[0].message.content
      .replace(/[*\[\](){}]/g, '') // 移除特殊符号
      .replace(/\s+/g, ' ') // 规范化空格
      .trim();

    return NextResponse.json({ story });
  } catch (error) {
    console.error("生成故事错误:", error);
    return NextResponse.json(
      { error: language === 'zh' ? "生成故事失败，请重试" : "Failed to generate story, please try again" },
      { status: 500 }
    );
  }
}
