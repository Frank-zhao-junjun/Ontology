import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ==================== Mock crypto for generateId ====================
vi.mock('@/lib/id', () => ({
  generateId: vi.fn(() => 'mock-id-12345'),
  generatePrefixedId: vi.fn((prefix: string) => `${prefix}_mock-id`),
}));

// ==================== Mock mammoth (used for docx) ====================
const mammothState = vi.hoisted(() => ({
  extractRawText: vi.fn().mockResolvedValue({ value: 'Extracted mammoth text content' }),
}));

vi.mock('mammoth', () => ({
  extractRawText: mammothState.extractRawText,
}));

// ==================== Mock pdf-parse ====================
// Route does: const pdfParse = (await import('pdf-parse')) as unknown as (buf) => Promise<{text}>
// Then: await pdfParse(buffer) - so import returns a callable function
const pdfParseState = vi.hoisted(() => ({
  parseFn: vi.fn().mockResolvedValue({ text: 'Extracted PDF text content' }),
}));

vi.mock('pdf-parse', () => pdfParseState.parseFn);

// ==================== Mock xlsx (for xlsx parsing) ====================
const xlsxState = vi.hoisted(() => ({
  read: vi.fn(() => ({
    SheetNames: ['Sheet1'],
    Sheets: {
      Sheet1: {},
    },
  })),
  utils: {
    sheet_to_json: vi.fn(() => [{ col1: 'val1', col2: 'val2' }]),
  },
}));

vi.mock('xlsx', () => ({
  read: xlsxState.read,
  utils: xlsxState.utils,
}));

import { POST } from './route';

describe('Reference Documents Upload Route (POST /api/reference-documents/upload)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== 1. Request Validation ====================

  it('缺少文件时应返回 400', async () => {
    const form = new FormData();
    const request = new NextRequest('http://localhost/api/reference-documents/upload', {
      method: 'POST',
      body: form,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toBe('未上传文件');
  });

  it('不支持的文件类型应返回 400', async () => {
    const form = new FormData();
    const file = new File(['some content'], 'test.exe', { type: 'application/x-msdownload' });
    form.append('file', file);

    const request = new NextRequest('http://localhost/api/reference-documents/upload', {
      method: 'POST',
      body: form,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('不支持的文件类型');
  });

  it('文件超过 10MB 应返回 400', async () => {
    const bigContent = Buffer.alloc(11 * 1024 * 1024).toString('hex');
    const form = new FormData();
    const file = new File([bigContent], 'test.txt', { type: 'text/plain' });
    form.append('file', file);

    const request = new NextRequest('http://localhost/api/reference-documents/upload', {
      method: 'POST',
      body: form,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('10MB');
  });

  // ==================== 2. Successful Uploads ====================

  it('txt 文件上传成功应返回文档内容', async () => {
    const form = new FormData();
    const file = new File(['Hello, this is a reference document.'], 'ref.txt', {
      type: 'text/plain',
    });
    form.append('file', file);

    const request = new NextRequest('http://localhost/api/reference-documents/upload', {
      method: 'POST',
      body: form,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toBeDefined();
    expect(payload.data.fileName).toBe('ref.txt');
    expect(payload.data.fileType).toBe('txt');
    expect(payload.data.fileSize).toBeGreaterThan(0);
    expect(payload.data.extractedText).toContain('reference document');
    expect(payload.data.textLength).toBeGreaterThan(0);
    expect(payload.data.parseStatus).toBe('success');
    expect(payload.data.id).toBe('mock-id-12345');
    expect(payload.data.title).toBe('Hello, this is a reference document.');
  });

  it('markdown 文件上传成功应正确提取文本', async () => {
    const form = new FormData();
    const file = new File(['# Title\n\nSome **bold** content.'], 'doc.md', {
      type: 'text/markdown',
    });
    form.append('file', file);

    const request = new NextRequest('http://localhost/api/reference-documents/upload', {
      method: 'POST',
      body: form,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.fileType).toBe('md');
    expect(payload.data.extractedText).toContain('**bold**');
  });

  it('csv 文件上传成功应正确提取文本', async () => {
    const form = new FormData();
    const file = new File(['name,age\nAlice,30\nBob,25'], 'data.csv', {
      type: 'text/csv',
    });
    form.append('file', file);

    const request = new NextRequest('http://localhost/api/reference-documents/upload', {
      method: 'POST',
      body: form,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.fileType).toBe('csv');
    expect(payload.data.extractedText).toContain('Alice');
  });

  it('docx 文件上传成功应调用 mammoth 提取文本', async () => {
    const form = new FormData();
    const file = new File(['fake-docx-content'], 'report.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    form.append('file', file);

    const request = new NextRequest('http://localhost/api/reference-documents/upload', {
      method: 'POST',
      body: form,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.fileType).toBe('docx');
    expect(mammothState.extractRawText).toHaveBeenCalled();
  });

  it('pdf 文件上传成功应返回文档信息（不含解析错误）', async () => {
    const form = new FormData();
    const file = new File(['fake-pdf-content'], 'report.pdf', {
      type: 'application/pdf',
    });
    form.append('file', file);

    const request = new NextRequest('http://localhost/api/reference-documents/upload', {
      method: 'POST',
      body: form,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.fileType).toBe('pdf');
    expect(payload.data.fileName).toBe('report.pdf');
    expect(payload.data.id).toBe('mock-id-12345');
  });

  // ==================== 3. Error Handling ====================

  it('解析失败时 parseStatus 应为 failed', async () => {
    mammothState.extractRawText.mockRejectedValueOnce(new Error('Corrupted docx'));

    const form = new FormData();
    const file = new File(['broken'], 'report.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    form.append('file', file);

    const request = new NextRequest('http://localhost/api/reference-documents/upload', {
      method: 'POST',
      body: form,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.parseStatus).toBe('failed');
    expect(payload.data.parseError).toBeDefined();
    expect(payload.data.extractedText).toBe('');
  });
});
