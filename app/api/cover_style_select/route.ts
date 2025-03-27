import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { style } = await request.json();
    
    if (!style) {
      return NextResponse.json({ error: 'Style parameter is required' }, { status: 400 });
    }

    const stylePath = path.join(process.cwd(), 'data', 'cover_style', `${style}.md`);
    
    // 检查文件是否存在
    if (!fs.existsSync(stylePath)) {
      return NextResponse.json({ error: 'Style file not found' }, { status: 404 });
    }

    // 读取文件内容
    const content = fs.readFileSync(stylePath, 'utf-8');
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error reading style file:', error);
    return NextResponse.json({ error: 'Failed to read style file' }, { status: 500 });
  }
} 