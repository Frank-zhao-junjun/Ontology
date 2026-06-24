import { NextRequest, NextResponse } from 'next/server';
import type { HRSyncConflict } from '@/types/ontology';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conflict, resolution } = body as {
      conflict: HRSyncConflict;
      resolution: 'hr_wins' | 'local_wins' | 'merged';
    };

    if (!conflict || !resolution) {
      return NextResponse.json(
        { error: '缺少冲突信息或解决方式' },
        { status: 400 },
      );
    }

    const resolved: HRSyncConflict = {
      ...conflict,
      resolution,
    };

    return NextResponse.json({
      success: true,
      conflict: resolved,
      message:
        resolution === 'hr_wins'
          ? `已采用 HR 系统的值：${conflict.hrValue}`
          : resolution === 'local_wins'
            ? `已保留本地值：${conflict.localValue}`
            : `已合并：保留本地值 ${conflict.localValue}，HR 值 ${conflict.hrValue} 待确认`,
    });
  } catch (error) {
    console.error('HR Sync resolve-conflict error:', error);
    return NextResponse.json(
      { error: '冲突处理失败' },
      { status: 500 },
    );
  }
}
