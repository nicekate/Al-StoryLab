import { NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;

    if (!file || !metadataStr) {
      console.error('缺少必要参数:', { hasFile: !!file, hasMetadata: !!metadataStr });
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const metadata = JSON.parse(metadataStr);
    const { fileName } = metadata;

    // 创建输出目录
    const outputDir = path.join(process.cwd(), 'public', 'output');
    await mkdir(outputDir, { recursive: true });

    // 保存音频文件
    const filePath = path.join(outputDir, fileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);
    console.log('音频文件已保存:', filePath);

    // 更新历史记录
    const historyPath = path.join(outputDir, 'history.json');
    let history = [];
    try {
      const historyContent = await readFile(historyPath, 'utf-8');
      history = JSON.parse(historyContent);
    } catch (error) {
      console.log('未找到历史记录文件或解析失败，将创建新文件');
    }

    // 添加新记录
    history.push(metadata);

    // 保存历史记录
    await writeFile(historyPath, JSON.stringify(history, null, 2));
    console.log('历史记录已更新');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存音频文件时出错:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存音频文件失败' },
      { status: 500 }
    );
  }
}
