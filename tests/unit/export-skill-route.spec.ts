/**
 * POST /api/export/skill 路由测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockBuildSkillZip } = vi.hoisted(() => ({
  mockBuildSkillZip: vi.fn(),
}));

vi.mock('@/lib/skill-export', () => ({
  buildSkillZip: mockBuildSkillZip,
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/export/skill/route';

function buildReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost:5000/api/export/skill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const fakeBuffer = Buffer.from('mock-zip');

describe('POST /api/export/skill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正常导出返回 200 + ZIP', async () => {
    mockBuildSkillZip.mockResolvedValue({
      buffer: fakeBuffer,
      filename: 'test.zip',
      projectStatus: 'draft',
    });

    const response = await POST(buildReq({ project: { id: 'p1', name: 'Test' } }));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    expect(response.headers.get('Content-Disposition')).toContain('test.zip');
    expect(response.headers.get('X-Project-Status')).toBe('draft');
  });

  it('缺少 project 返回 400', async () => {
    const response = await POST(buildReq({}));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('MISSING_PROJECT');
  });

  it('无效 scope 返回 400', async () => {
    const response = await POST(buildReq({ project: { id: 'p1' }, scope: 'bad' }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('INVALID_SCOPE');
  });

  it('EMPTY_SCOPE 返回 400', async () => {
    mockBuildSkillZip.mockRejectedValue(new Error('EMPTY_SCOPE'));

    const response = await POST(buildReq({ project: { id: 'empty' } }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('EMPTY_SCOPE');
  });

  it('其他异常返回 500', async () => {
    mockBuildSkillZip.mockRejectedValue(new Error('internal boom'));

    const response = await POST(buildReq({ project: { id: 'p1' } }));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('INTERNAL_ERROR');
  });

  it('默认 scope=all includeExamples=true includeSemanticLayer=true', async () => {
    mockBuildSkillZip.mockResolvedValue({
      buffer: fakeBuffer,
      filename: 'test.zip',
      projectStatus: 'unknown',
    });

    await POST(buildReq({ project: { id: 'p1' } }));
    expect(mockBuildSkillZip).toHaveBeenCalledWith(
      { id: 'p1' },
      { scope: 'all', includeExamples: true, includeSemanticLayer: true },
    );
  });

  it('自定义参数正确传递', async () => {
    mockBuildSkillZip.mockResolvedValue({
      buffer: fakeBuffer,
      filename: 'test.zip',
      projectStatus: 'unknown',
    });

    await POST(buildReq({
      project: { id: 'p1' },
      scope: 'data',
      includeExamples: false,
      includeSemanticLayer: false,
    }));
    expect(mockBuildSkillZip).toHaveBeenCalledWith(
      { id: 'p1' },
      { scope: 'data', includeExamples: false, includeSemanticLayer: false },
    );
  });
});
