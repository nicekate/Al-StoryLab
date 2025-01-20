import { NextResponse } from "next/server";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { audio, fileName } = await req.json();

    if (!audio || !fileName) {
      return NextResponse.json(
        { error: "音频数据和文件名不能为空" },
        { status: 400 }
      );
    }

    // 确保目录存在
    const publicDir = path.join(process.cwd(), 'public');
    const soundEffectsDir = path.join(publicDir, 'sound-effects');
    await mkdir(soundEffectsDir, { recursive: true });

    // 将 base64 音频数据转换为 Buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    const filePath = path.join(soundEffectsDir, fileName);

    // 保存文件
    await writeFile(filePath, audioBuffer);

    return NextResponse.json({ success: true, filePath: `/sound-effects/${fileName}` });
  } catch (error) {
    console.error("保存音频文件错误:", error);
    return NextResponse.json(
      { error: "保存音频文件失败" },
      { status: 500 }
    );
  }
}
