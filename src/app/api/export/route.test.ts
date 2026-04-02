import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { createFrozenProject } from '../../../../tests/unit/test-helpers';

describe('Export Route', () => {
  it('GET 应返回导出模板与 EPC 导出结构', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.configTemplate).toEqual({ includeData: false });
    expect(payload.data.exportStructure).toContain('data/epc.json');
    expect(payload.data.exportStructure).toContain('epc/{aggregate}.md');
  });

  it('POST 缺少 project 时应返回 400', async () => {
    const request = new NextRequest('http://localhost/api/export', {
      method: 'POST',
      body: JSON.stringify({ config: { includeData: false } }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ success: false, error: '项目数据不能为空' });
  });

  it('POST 应返回导出结果与 downloadUrl', async () => {
    const request = new NextRequest('http://localhost/api/export', {
      method: 'POST',
      body: JSON.stringify({
        project: createFrozenProject('1.0.0'),
        config: { includeData: false },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.downloadUrl).toMatch(/^data:application\/json;base64,/);
    expect(payload.data.manifest.version).toBe('1.0.0');
    expect(payload.data.files.some((file: { path: string }) => file.path === 'epc/contract.md')).toBe(true);
  });

  it('POST 当导出器校验失败时应返回 500', async () => {
    const brokenProject = { ...createFrozenProject('1.0.0'), name: '' };
    const request = new NextRequest('http://localhost/api/export', {
      method: 'POST',
      body: JSON.stringify({
        project: brokenProject,
        config: { includeData: false },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('项目名称不能为空');
  });
});