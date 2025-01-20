import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { story, soundEffects } = await req.json();

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "缺少 DEEPSEEK_API_KEY" },
        { status: 500 }
      );
    }

    const prompt = `Analyze this story and suggest where to place the sound effects. Requirements:

    故事：
    ${story}

    音效：
    ${soundEffects.join('\n')}

    Please create a detailed placement guide that includes:
    1. The specific moment or sentence where each sound effect should be placed
    2. A brief explanation in Chinese for why this placement enhances the story
    3. Format each suggestion as:
       音效: [English sound effect]
       位置: [relevant story text]
       说明: [Chinese explanation]

    Keep explanations concise and focus on how each sound effect enhances the storytelling.`;

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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const placementGuide = data.choices[0].message.content;

    return NextResponse.json({ placementGuide });
  } catch (error) {
    console.error("生成音效位置建议错误:", error);
    return NextResponse.json(
      { error: "生成音效位置建议失败，请重试" },
      { status: 500 }
    );
  }
}
