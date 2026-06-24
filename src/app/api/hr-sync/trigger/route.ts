import { NextRequest, NextResponse } from 'next/server';
import type {
  HRSyncConfig,
  HRSyncResult,
  Department,
  Position,
} from '@/types/ontology';

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, departments, positions } = body as {
      config: HRSyncConfig;
      departments: Department[];
      positions: Position[];
    };

    if (!config) {
      return NextResponse.json(
        { error: '缺少同步配置' },
        { status: 400 },
      );
    }

    const syncId = generateId();
    const now = new Date().toISOString();

    // Simulate sync result calculation
    const hrDepartments = departments || [];
    const hrPositions = positions || [];

    const result: HRSyncResult = {
      syncId,
      triggeredAt: now,
      completedAt: now,
      status: 'success',
      source: config.source,
      summary: {
        departments: {
          total: hrDepartments.length,
          created: hrDepartments.length,
          updated: 0,
          deactivated: 0,
          unchanged: 0,
        },
        positions: {
          total: hrPositions.length,
          created: hrPositions.length,
          updated: 0,
          deactivated: 0,
          unchanged: 0,
        },
      },
      conflicts: [],
      errors: [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('HR Sync trigger error:', error);
    return NextResponse.json(
      { error: 'HR 同步触发失败' },
      { status: 500 },
    );
  }
}
