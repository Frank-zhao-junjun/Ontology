import { NextRequest, NextResponse } from 'next/server';
import type { HRSyncResult } from '@/types/ontology';

// In-memory store for demo
const syncHistory: HRSyncResult[] = [];

export async function GET() {
  try {
    return NextResponse.json(syncHistory);
  } catch (error) {
    console.error('HR Sync history GET error:', error);
    return NextResponse.json(
      { error: '获取同步历史失败' },
      { status: 500 },
    );
  }
}

// Allow trigger route to push results here
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = body as HRSyncResult;

    if (!result || !result.syncId) {
      return NextResponse.json(
        { error: '缺少同步结果数据' },
        { status: 400 },
      );
    }

    syncHistory.unshift(result);
    // Keep max 100 records
    if (syncHistory.length > 100) {
      syncHistory.length = 100;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('HR Sync history POST error:', error);
    return NextResponse.json(
      { error: '记录同步历史失败' },
      { status: 500 },
    );
  }
}
