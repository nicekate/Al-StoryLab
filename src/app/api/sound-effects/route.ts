import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

interface SoundEffectRequest {
  text: string;
  duration_seconds?: number;
  prompt_influence?: number;
}

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
    const { text, duration_seconds, prompt_influence } = await req.json() as SoundEffectRequest;

    if (!text) {
      return NextResponse.json(
        { error: "文本不能为空" },
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

    // 调用ElevenLabs API生成音效
    console.log('正在生成音效:', text);
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        duration_seconds: duration_seconds || undefined,
        prompt_influence: prompt_influence || 0.3,
      }),
    });

    if (!response.ok) {
      console.error('ElevenLabs API错误:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `生成音效失败: ${response.statusText}`);
    }

    // 获取并保存音频数据
    const audioBuffer = await response.arrayBuffer();
    const { fileName, filePath } = await saveAudioFile(audioBuffer, text, outputDir);
    
    // 创建新记录
    const timestamp = new Date().toISOString();
    const newRecord = {
      id: timestamp,
      text,
      fileName,
      type: 'sound-effect',
      createdAt: timestamp,
      filePath,
      duration_seconds,
      prompt_influence
    };

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
    history.unshift(newRecord);

    // 保存历史记录
    await writeFile(historyPath, JSON.stringify(history, null, 2));

    return NextResponse.json({
      success: true,
      ...newRecord
    });
  } catch (error) {
    console.error('生成音效时出错:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成音效失败' },
      { status: 500 }
    );
  }
}
