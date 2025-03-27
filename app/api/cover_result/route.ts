import { NextResponse } from 'next/server';
import { saveCoverResult, getCoverResults, CoverResult } from '@/lib/fileUtils';

export async function POST(request: Request) {
  try {
    const result: CoverResult = await request.json();
    
    console.log('Saving cover result:', {
      timestamp: result.timestamp,
      style: result.style,
      coverText: result.coverText,
      accountName: result.accountName,
      slogan: result.slogan
    });
    
    const saveResult = await saveCoverResult(result);
    
    if (!saveResult.success) {
      console.error('Failed to save cover result:', saveResult.error);
      return NextResponse.json(
        { error: 'Failed to save cover result', details: saveResult.error },
        { status: 500 }
      );
    }
    
    console.log('Successfully saved cover result:', saveResult.filePath);
    return NextResponse.json({ success: true, filePath: saveResult.filePath });
  } catch (error) {
    console.error('Error in cover result API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const results = await getCoverResults();
    console.log('Retrieved cover results:', results.length);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error getting cover results:', error);
    return NextResponse.json(
      { error: 'Failed to get cover results', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 