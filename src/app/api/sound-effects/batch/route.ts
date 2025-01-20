import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

async function ensureDirectoryExists(dir: string) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    console.error('创建目录失败:', error);
    throw error;
  }
}

async function saveAudioFile(audioBuffer: ArrayBuffer, text: string, outputDir: string) {
  try {
    // 生成文件名：时间戳-文本前30个字符
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const truncatedText = text.slice(0, 30).replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `sfx-${timestamp}-${truncatedText}.mp3`;
    const filePath = path.join(outputDir, fileName);

    // 保存文件
    await writeFile(filePath, Buffer.from(audioBuffer));
    console.log('音效文件已保存:', filePath);

    return {
      fileName,
      filePath: `/sound-effects/${fileName}`
    };
  } catch (error) {
    console.error('保存音频文件失败:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { effects } = await req.json();

    if (!Array.isArray(effects) || effects.length === 0) {
      return NextResponse.json(
        { error: "音效列表不能为空" },
        { status: 400 }
      );
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "缺少 ELEVENLABS_API_KEY" },
        { status: 500 }
      );
    }

    // 确保输出目录存在
    const outputDir = path.join(process.cwd(), 'public', 'sound-effects');
    await ensureDirectoryExists(outputDir);

    const results = [];
    const errors = [];

    // 逐个生成音效
    for (const text of effects) {
      try {
        console.log('正在生成音效:', text);
        
        // 调用ElevenLabs API
        const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text,
            duration_seconds: null,
            prompt_influence: 0.3,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `生成音效失败: ${response.statusText}`);
        }

        // 获取并保存音频数据
        const audioBuffer = await response.arrayBuffer();
        const { fileName, filePath } = await saveAudioFile(audioBuffer, text, outputDir);

        // 记录结果
        const timestamp = new Date().toISOString();
        results.push({
          id: timestamp,
          text,
          fileName,
          type: 'sound-effect',
          createdAt: timestamp,
          filePath
        });

        console.log('音效生成成功:', fileName);
      } catch (error) {
        console.error('生成音效失败:', text, error);
        errors.push({
          text,
          error: error instanceof Error ? error.message : '生成音效失败'
        });
      }

      // 添加延迟以避免API限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 更新历史记录
    const historyPath = path.join(outputDir, 'history.json');
    let history = [];
    try {
      const historyContent = await import('fs/promises').then(fs => 
        fs.readFile(historyPath, 'utf-8')
      ).catch(() => '[]');
      history = JSON.parse(historyContent);
    } catch (error) {
      console.log('创建新的音效历史记录');
    }

    // 添加新记录
    history.unshift(...results);

    // 保存历史记录
    await writeFile(historyPath, JSON.stringify(history, null, 2));

    return NextResponse.json({
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('批量生成音效时出错:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '批量生成音效失败' },
      { status: 500 }
    );
  }
}
