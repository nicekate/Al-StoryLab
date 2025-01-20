import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, count = 6 } = await request.json();

    // 验证count范围
    const promptCount = Math.max(1, Math.min(30, count));

    const systemPrompt = `你是一个专业的儿童绘本插画师和AI绘画提示词专家。
请为这段文字生成${promptCount}个不同场景的绘图提示词。

重要提示：
- 不要在提示词中使用角色名字，而是用具体的外观特征来描述角色
- 例如：不要用"小白兔"这样的名字，而是描述"一只白色的小兔子，有着蓬松的毛发和红色的眼睛"

要求：
1. 角色形象和风格的严格一致性：
   - 用具体的视觉特征描述角色，而不是用名字
   - 主角的外观特征（服装、毛色、体型等）在所有场景中必须保持一致
   - 主角的性格特征要通过外观和动作来体现
   - 配角的设计风格要与主角协调统一
2. 场景连续性：
   - 场景之间要有清晰的故事发展脉络
   - 环境元素的设计要前后呼应
3. 艺术风格的统一：
   - 所有场景使用相同的绘画风格（如：水彩风格、插画风格等）
   - 色彩方案要保持一致
   - 光影效果要统一
4. 适合儿童绘本的表现方式：
   - 画面要富有童趣和想象力
   - 构图要简单清晰
   - 情感表达要生动直观

每个场景需要包含：
1. 场景描述（中文，简短精炼）
2. 详细的英文提示词，分段描述以下要素：
   - Character: 角色的具体外观特征、表情、动作描述（不使用角色名字）
   - Scene: 场景环境、氛围、天气等
   - Lighting: 光线效果、时间、色调
   - Composition: 画面构图、视角、重点
   - Style: 具体的艺术风格、绘画技法
   - Additional: 其他重要细节

输出格式：
[
  {
    "description": "场景描述",
    "prompt": "Character:\\n[角色具体特征描述]\\n\\nScene:\\n[场景描述]\\n\\nLighting:\\n[光影描述]\\n\\nComposition:\\n[构图描述]\\n\\nStyle:\\n[风格描述]\\n\\nAdditional:\\n[补充细节]",
    "text_snippet": "对应的文本片段",
    "importance": "场景重要性评分（1-5）"
  },
  ...
]`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Deepseek API请求失败: ${response.status}`);
    }

    const data = await response.json();
    console.log('Deepseek API响应:', data);

    let prompts;
    try {
      prompts = JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('解析提示词失败:', error);
      console.log('原始响应:', data.choices[0].message.content);
      throw new Error('解析提示词失败');
    }

    const newPrompts = prompts.map(prompt => {
      delete prompt.importance;
      return prompt;
    });

    return NextResponse.json({ prompts: newPrompts });
  } catch (error) {
    console.error('生成提示词错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成提示词失败' },
      { status: 500 }
    );
  }
}
