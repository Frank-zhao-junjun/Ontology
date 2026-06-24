import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockProject } from '../../../../../tests/unit/test-helpers';

const supabaseState = vi.hoisted(() => ({
  listResult: { data: [] as unknown[], error: null as { message: string } | null },
  insertResult: { data: null as unknown, error: null as { message: string } | null },
  updateResult: { data: null as unknown, error: null as { message: string } | null },
  maybeSingleResult: { data: null as unknown, error: null as { message: string } | null },
  deleteResult: { error: null as { message: string } | null },
  lastInsertPayload: null as unknown,
  lastUpdatePayload: null as unknown,
  lastEq: null as { column: string; value: string } | null,
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
          void column;
          void options;
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
          if (operation === 'insert') {
            return Promise.resolve(supabaseState.insertResult);
          }
          if (operation === 'update') {
            return Promise.resolve(supabaseState.updateResult);
          }
          return Promise.resolve(supabaseState.maybeSingleResult);
        },
      };

      return builder;
    },
  };
}

vi.mock('@/storage/database/supabase-client', () => ({
  getSupabaseClient: vi.fn(() => createMockSupabaseClient()),
}));

import { DELETE, GET, PUT } from './route';

describe('Project Detail Route', () => {
  beforeEach(() => {
    supabaseState.listResult = { data: [], error: null };
    supabaseState.insertResult = { data: null, error: null };
    supabaseState.updateResult = { data: null, error: null };
    supabaseState.maybeSingleResult = { data: null, error: null };
    supabaseState.deleteResult = { error: null };
    supabaseState.lastInsertPayload = null;
    supabaseState.lastUpdatePayload = null;
    supabaseState.lastEq = null;
    supabaseState.fromCalls = [];
    supabaseState.selectCalls = [];
  });

  it('GET 项目存在时应返回 project_data', async () => {
    const project = createMockProject();
    supabaseState.maybeSingleResult = {
      data: { project_data: project },
      error: null,
    };

    const response = await GET(new NextRequest('http://localhost/api/projects/project-1'), {
      params: Promise.resolve({ id: 'project-1' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(project);
    expect(supabaseState.lastEq).toEqual({ column: 'id', value: 'project-1' });
  });

  it('GET 项目不存在时应返回 404', async () => {
    supabaseState.maybeSingleResult = {
      data: null,
      error: null,
    };

    const response = await GET(new NextRequest('http://localhost/api/projects/missing'), {
      params: Promise.resolve({ id: 'missing' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toBe('项目不存在');
  });

  it('PUT 缺少 project 时应返回 400', async () => {
    const response = await PUT(new NextRequest('http://localhost/api/projects/project-1', {
      method: 'PUT',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    }), {
      params: Promise.resolve({ id: 'project-1' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('项目数据不能为空');
  });

  it('PUT 更新命中现有项目时应返回更新结果', async () => {
    const project = createMockProject({ name: '合同平台' });
    supabaseState.updateResult = {
      data: { id: project.id, name: '合同平台' },
      error: null,
    };

    const response = await PUT(new NextRequest('http://localhost/api/projects/project-1', {
      method: 'PUT',
      body: JSON.stringify({ project }),
      headers: { 'content-type': 'application/json' },
    }), {
      params: Promise.resolve({ id: 'project-1' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({ id: project.id, name: '合同平台' });
    expect(supabaseState.lastUpdatePayload).toEqual(expect.objectContaining({
      name: '合同平台',
      project_data: project,
    }));
  });

  it('PUT 应保留业务场景快照到 project_data', async () => {
    const project = createMockProject();
    project.dataModel!.businessScenarios = [
      {
        id: 'scenario-2',
        name: '到货登记',
        nameEn: 'GoodsReceipt',
        description: '到货登记业务场景',
        projectId: 'project-1',
        color: '#22c55e',
      },
    ];
    supabaseState.updateResult = {
      data: { id: project.id, updated: true },
      error: null,
    };

    const response = await PUT(new NextRequest('http://localhost/api/projects/project-1', {
      method: 'PUT',
      body: JSON.stringify({ project }),
      headers: { 'content-type': 'application/json' },
    }), {
      params: Promise.resolve({ id: 'project-1' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(supabaseState.lastUpdatePayload).toEqual(expect.objectContaining({
      project_data: expect.objectContaining({
        dataModel: expect.objectContaining({
          businessScenarios: [
            expect.objectContaining({
              id: 'scenario-2',
              name: '到货登记',
              projectId: 'project-1',
              color: '#22c55e',
            }),
          ],
        }),
      }),
    }));
  });

  it('PUT 更新未命中时应回退为插入', async () => {
    const project = createMockProject();
    supabaseState.updateResult = {
      data: null,
      error: null,
    };
    supabaseState.insertResult = {
      data: { id: project.id, created: true },
      error: null,
    };

    const response = await PUT(new NextRequest('http://localhost/api/projects/project-1', {
      method: 'PUT',
      body: JSON.stringify({ project }),
      headers: { 'content-type': 'application/json' },
    }), {
      params: Promise.resolve({ id: 'project-1' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({ id: project.id, created: true });
    expect(supabaseState.lastInsertPayload).toEqual(expect.objectContaining({
      id: project.id,
      project_data: project,
      created_at: project.createdAt,
    }));
  });

  it('DELETE 成功时应返回 success=true', async () => {
    const response = await DELETE(new NextRequest('http://localhost/api/projects/project-1', {
      method: 'DELETE',
    }), {
      params: Promise.resolve({ id: 'project-1' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true });
    expect(supabaseState.lastEq).toEqual({ column: 'id', value: 'project-1' });
  });

  it('DELETE 数据库删除失败时应返回 500', async () => {
    supabaseState.deleteResult = {
      error: { message: 'foreign key violation' },
    };

    const response = await DELETE(new NextRequest('http://localhost/api/projects/project-1', {
      method: 'DELETE',
    }), {
      params: Promise.resolve({ id: 'project-1' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('删除项目失败: foreign key violation');
  });
});