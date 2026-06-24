import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES: Record<string, string> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
};

function generateId() {
  return 'ref-' + Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: '未上传文件' }, { status: 400 });
    }

    const fileType = ALLOWED_TYPES[file.type];
    if (!fileType) {
      return NextResponse.json({ success: false, error: `不支持的文件类型: ${file.type}` }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `文件大小超过10MB限制(当前${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';
    let parseStatus: 'success' | 'failed' = 'success';
    let parseError: string | undefined;

    try {
      switch (fileType) {
        case 'docx': {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
          break;
        }
        case 'pdf': {
          const pdfParse = (await import('pdf-parse')) as unknown as (buf: Buffer) => Promise<{ text: string }>;
          const result = await pdfParse(buffer);
          extractedText = result.text;
          break;
        }
        case 'xlsx': {
          const XLSX = await import('xlsx');
          const wb = XLSX.read(buffer, { type: 'buffer' });
          const texts: string[] = [];
          for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
            texts.push(`[Sheet: ${sheetName}]`);
            for (const row of data) {
              texts.push(Object.values(row).join(' | '));
            }
          }
          extractedText = texts.join('\n');
          break;
        }
        case 'txt':
        case 'md':
        case 'csv':
          extractedText = new TextDecoder('utf-8').decode(buffer);
          break;
      }
    } catch (err) {
      parseStatus = 'failed';
      parseError = err instanceof Error ? err.message : '文档解析失败';
    }

    // Extract title from first meaningful line
    const lines = extractedText.split('\n').map((l) => l.trim()).filter(Boolean);
    const title = lines.find((l) => l.length > 2 && l.length < 100) || file.name.replace(/\.[^.]+$/, '');

    const doc = {
      id: generateId(),
      fileName: file.name,
      fileType: fileType as 'docx' | 'pdf' | 'xlsx' | 'txt' | 'md' | 'csv',
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      extractedText,
      textLength: extractedText.length,
      parseStatus,
      parseError,
      title,
    };

    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, error: `上传失败: ${message}` }, { status: 500 });
  }
}

