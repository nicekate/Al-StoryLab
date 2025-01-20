import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, count = 10 } = await req.json();

    // 验证count范围
    const suggestionsCount = Math.max(1, Math.min(30, count));

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "缺少 DEEPSEEK_API_KEY" },
        { status: 500 }
      );
    }

    const prompt = `Analyze the story and suggest exactly ${suggestionsCount} detailed sound effects. For each effect, provide a rich description in English (max 70 words) that captures the mood, intensity, and timing. Include:

    1. Environmental Ambience:
       - Background atmosphere and nature sounds
       - Weather effects
       - Location-specific ambient sounds
    
    2. Character Actions:
       - Movement and interaction sounds
       - Emotional expressions
       - Physical reactions
    
    3. Scene Transitions:
       - Mood-setting sounds
       - Background music suggestions
       - Dramatic effect sounds
    
    4. For each sound effect:
       - Describe the sound quality (pitch, volume, duration)
       - Specify when it should occur in the story
       - Suggest how it enhances the narrative
       - Keep each description under 70 words
       - Use natural English without special characters
    
    Story:
    ${text}
    
    List each sound effect on a new line, starting with a descriptive title followed by a colon and the detailed description.`;

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
    const suggestions = data.choices[0].message.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.length > 0)
      .map(line => line
        .replace(/^\d+\.\s*|-\s*|\*\s*/g, '')  // 移除序号和列表符号
        .trim()
      )
      .filter(line => line.length > 0)
      .slice(0, suggestionsCount);  // 使用配置的数量

    return NextResponse.json({ soundEffects: suggestions });
  } catch (error) {
    console.error("生成音效建议错误:", error);
    return NextResponse.json(
      { error: "生成音效建议失败，请重试" },
      { status: 500 }
    );
  }
}
