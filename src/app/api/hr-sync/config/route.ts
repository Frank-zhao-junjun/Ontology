import { NextRequest, NextResponse } from 'next/server';
import type { HRSyncConfig } from '@/types/ontology';

// In-memory store for demo (server-side only, resets on restart)
let storedConfig: HRSyncConfig | null = null;

export async function GET() {
  try {
    if (!storedConfig) {
      return NextResponse.json(
        { error: '未配置 HR 同步' },
        { status: 404 },
      );
    }
    return NextResponse.json(storedConfig);
  } catch (error) {
    console.error('HR Sync config GET error:', error);
    return NextResponse.json(
      { error: '获取配置失败' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const config = body as HRSyncConfig;

    if (!config || !config.source) {
      return NextResponse.json(
        { error: '缺少必需的同步配置字段' },
        { status: 400 },
      );
    }

    storedConfig = config;
    return NextResponse.json({ success: true, config: storedConfig });
  } catch (error) {
    console.error('HR Sync config PUT error:', error);
    return NextResponse.json(
      { error: '更新配置失败' },
      { status: 500 },
    );
  }
}
