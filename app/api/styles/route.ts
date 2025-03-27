import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const stylesDir = path.join(process.cwd(), 'data', 'cover_style');
    const files = fs.readdirSync(stylesDir);
    const options = files
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        value: file.replace('.md', ''),
        label: file.replace('.md', '')
      }));
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Error loading style options:', error);
    return NextResponse.json({ error: 'Failed to load style options' }, { status: 500 });
  }
} 