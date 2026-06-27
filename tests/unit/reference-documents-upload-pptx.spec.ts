import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/id', () => ({
  generateId: vi.fn(() => 'ppt-mock-id'),
  generatePrefixedId: vi.fn((prefix: string) => `${prefix}_mock-id`),
}));

const markitdownState = vi.hoisted(() => ({
  convertResult: '# Slide 1\n\n采购流程说明',
}));

vi.mock('@/lib/copilot/parse-pptx-markitdown', () => ({
  convertPptxToMarkdown: vi.fn(async () => markitdownState.convertResult),
}));

import { POST as uploadPost } from '@/app/api/reference-documents/upload/route';
import { convertPptxToMarkdown } from '@/lib/copilot/parse-pptx-markitdown';

describe('reference-documents upload — pptx MarkItDown branch', () => {
  beforeEach(() => {
    vi.mocked(convertPptxToMarkdown).mockResolvedValue(markitdownState.convertResult);
  });

  it('accepts .pptx and returns markdown extractedText via MarkItDown', async () => {
    const file = new File(['fake-pptx'], 'sop.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    const formData = new FormData();
    formData.append('file', file);

    const request = new NextRequest('http://localhost/api/reference-documents/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadPost(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.fileType).toBe('pptx');
    expect(payload.data.extractedText).toContain('采购流程说明');
    expect(convertPptxToMarkdown).toHaveBeenCalled();
  });

  it('returns parse error when MarkItDown fails', async () => {
    vi.mocked(convertPptxToMarkdown).mockRejectedValue(
      new Error('PPTX 解析需要 MarkItDown，当前环境未安装'),
    );

    const file = new File(['fake-pptx'], 'fail.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    const formData = new FormData();
    formData.append('file', file);

    const request = new NextRequest('http://localhost/api/reference-documents/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadPost(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.parseStatus).toBe('failed');
    expect(payload.data.parseError).toContain('MarkItDown');
  });
});
