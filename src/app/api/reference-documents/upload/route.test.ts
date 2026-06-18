import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const pdfState = vi.hoisted(() => ({
  destroyed: false,
}));

vi.mock('pdf-parse', () => {
  class PDFParse {
    constructor(private readonly options: { data: Buffer }) {}

    async getText() {
      expect(Buffer.isBuffer(this.options.data)).toBe(true);
      return { text: '合同编号\n采购合同正文' };
    }

    async destroy() {
      pdfState.destroyed = true;
    }
  }

  return { PDFParse };
});

describe('Reference document upload route', () => {
  it('应使用 pdf-parse v2 API 解析 PDF 文本', async () => {
    const form = new FormData();
    form.append('file', new File([Buffer.from('%PDF-1.4 test')], 'contract.pdf', { type: 'application/pdf' }));

    const response = await POST(new NextRequest('http://localhost/api/reference-documents/upload', {
      method: 'POST',
      body: form,
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toMatchObject({
      fileName: 'contract.pdf',
      fileType: 'pdf',
      parseStatus: 'success',
      extractedText: '合同编号\n采购合同正文',
      textLength: '合同编号\n采购合同正文'.length,
      title: '合同编号',
    });
    expect(pdfState.destroyed).toBe(true);
  });
});
