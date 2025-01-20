import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const historyFile = path.join(process.cwd(), 'public', 'sound-effects', 'history.json');

export async function GET() {
  try {
    try {
      await fs.access(historyFile);
    } catch {
      await fs.writeFile(historyFile, '[]', 'utf-8');
    }
    
    const history = await fs.readFile(historyFile, 'utf-8');
    return NextResponse.json(JSON.parse(history));
  } catch (error) {
    console.error('Error reading sound effect history:', error);
    return NextResponse.json([], { status: 200 });
  }
}
