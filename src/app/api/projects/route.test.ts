import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockProject } from '../../../../tests/unit/test-helpers';

const supabaseState = vi.hoisted(() => ({
  listResult: { data: [] as unknown[], error: null as { message: string } | null },
  insertResult: { data: null as unknown, error: null as { message: string } | null },
  updateResult: { data: null as unknown, error: null as { message: string } | null },
  maybeSingleResult: { data: null as unknown, error: null as { message: string } | null },
  deleteResult: { error: null as { message: string } | null },
  lastInsertPayload: null as unknown,
  lastUpdatePayload: null as unknown,
  lastEq: null as { column: string; value: string } | null,
  lastOrder: null as { column: string; options: unknown } | null,
  fromCalls: [] as string[],
  selectCalls: [] as string[],
}));

function createMockSupabaseClient() {
  return {
    from(table: string) {
      supabaseState.fromCalls.push(table);
      let operation: 'select' | 'insert' | 'update' | 'delete' = 'select';

      const builder = {
        select(columns?: string) {
          if (columns) {
            supabaseState.selectCalls.push(columns);
          }
          return builder;
        },
        order(column: string, options: unknown) {
          supabaseState.lastOrder = { column, options };
          return Promise.resolve(supabaseState.listResult);
        },
        insert(payload: unknown) {
          operation = 'insert';
          supabaseState.lastInsertPayload = payload;
          return builder;
        },
        update(payload: unknown) {
          operation = 'update';
          supabaseState.lastUpdatePayload = payload;
          return builder;
        },
        delete() {
          operation = 'delete';
          return builder;
        },
        eq(column: string, value: string) {
          supabaseState.lastEq = { column, value };
          if (operation === 'delete') {
            return Promise.resolve(supabaseState.deleteResult);
          }
          return builder;
        },
        single() {
          return Promise.resolve(supabaseState.insertResult);
        },
        maybeSingle() {
          return Promise.resolve(operation === 'update' ? supabaseState.updateResult : supabaseState.maybeSingleResult);
        },
      };

      return builder;
    },
  };
}

vi.mock('@/storage/database/supabase-client', () => ({
  getSupabaseClient: vi.fn(() => createMockSupabaseClient()),
}));

import { GET, POST } from './route';

describe('Projects Route', () => {
  beforeEach(() => {
    supabaseState.listResult = { data: [], error: null };
    supabaseState.insertResult = { data: null, error: null };
    supabaseState.updateResult = { data: null, error: null };
    supabaseState.maybeSingleResult = { data: null, error: null };
    supabaseState.deleteResult = { error: null };
    supabaseState.lastInsertPayload = null;
    supabaseState.lastUpdatePayload = null;
    supabaseState.lastEq = null;
    supabaseState.lastOrder = null;
    supabaseState.fromCalls = [];
    supabaseState.selectCalls = [];
  });

  it('GET 应返回按更新时间排序的项目列表', async () => {
    supabaseState.listResult = {
      data: [{ id: 'project-1', name: '合同管理系统' }],
      error: null,
    };

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual([{ id: 'project-1', name: '合同管理系统' }]);
    expect(supabaseState.fromCalls).toEqual(['ontology_projects']);
    expect(supabaseState.lastOrder).toEqual({ column: 'updated_at', options: { ascending: false } });
  });

  it('GET 查询异常时应返回 500', async () => {
    supabaseState.listResult = {
      data: null as unknown as unknown[],
      error: { message: 'boom' },
    };

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('查询项目列表失败: boom');
  });

  it('POST 缺少必填字段时应返回 400', async () => {
    const response = await POST(new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ project: { name: '', domain: null } }),
      headers: { 'content-type': 'application/json' },
    }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('项目名称和领域不能为空');
  });

  it('POST 应写入项目快照并返回新记录', async () => {
    const project = createMockProject();
    supabaseState.insertResult = {
      data: { id: project.id, name: project.name },
      error: null,
    };

    const response = await POST(new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ project }),
      headers: { 'content-type': 'application/json' },
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({ id: project.id, name: project.name });
    expect(supabaseState.lastInsertPayload).toEqual(expect.objectContaining({
      id: project.id,
      name: project.name,
      domain_id: project.domain.id,
      domain_name: project.domain.name,
      project_data: project,
    }));
  });
});