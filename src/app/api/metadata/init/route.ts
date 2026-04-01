import { NextRequest, NextResponse } from 'next/server';
import { FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// 元数据Excel文件URL
const METADATA_EXCEL_URL = 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E5%85%83%E6%95%B0%E6%8D%AE%E6%B8%85%E5%8D%95.xlsx&nonce=1fffafa9-398a-4fad-b4a6-4d7bcfc21fe6&project_id=7622288804682121258&sign=373d3ca7cadfb13dd5dada87befc1e3a3bbad0a4455a5d58a791f92cbadf60e0';

const generateId = () => Math.random().toString(36).substring(2, 10);

export async function GET(request: NextRequest) {
  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new FetchClient(config, customHeaders);

    const response = await client.fetch(METADATA_EXCEL_URL);

    if (response.status_code !== 0) {
      return NextResponse.json(
        { error: response.status_message || '获取元数据文件失败' },
        { status: 500 }
      );
    }

    // 解析Excel内容
    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    // 解析Markdown表格格式
    const metadata = parseMarkdownTable(textContent);

    return NextResponse.json({
      success: true,
      data: metadata,
      total: metadata.length
    });

  } catch (error) {
    console.error('Fetch metadata error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取元数据失败' },
      { status: 500 }
    );
  }
}

// 解析Markdown表格格式
interface MetadataRow {
  [key: string]: string;
}

function parseMarkdownTable(content: string): MetadataRow[] {
  const lines = content.split('\n').filter(line => line.trim());
  const metadata: MetadataRow[] = [];

  // 查找表头行（包含字段中文名的行）
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('字段中文名') && lines[i].includes('字段英文名')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return [];
  }

  // 解析表头
  const headerLine = lines[headerIndex];
  const headers = parseMarkdownRow(headerLine);
  const headerMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    headerMap[h.trim()] = idx;
  });

  // 跳过分隔行，解析数据行
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.startsWith('|')) continue;

    const values = parseMarkdownRow(line);
    if (values.length >= headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header.trim()] = values[idx]?.trim() || '';
      });

      // 只添加有效数据行（字段中文名不为空）
      if (row['字段中文名'] && row['字段英文名']) {
        metadata.push({
          id: generateId(),
          domain: row['领域'] || '',
          name: row['字段中文名'],
          nameEn: row['字段英文名'],
          description: row['业务含义'] || '',
          type: mapFieldType(row['字段属性']),
          valueRange: row['值范围'] || '',
          standard: row['参考标准'] || '',
          source: row['信息源头'] || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  return metadata;
}

// 解析Markdown表格行
function parseMarkdownRow(line: string): string[] {
  // 移除首尾的 |
  let content = line.trim();
  if (content.startsWith('|')) content = content.slice(1);
  if (content.endsWith('|')) content = content.slice(0, -1);

  // 按 | 分割
  return content.split('|').map(cell => cell.trim());
}

// 映射字段类型
function mapFieldType(typeStr: string): string {
  if (!typeStr) return 'string';
  
  const type = typeStr.toLowerCase();
  
  if (type.includes('字符串') || type.includes('varchar')) return 'string';
  if (type.includes('整数') || type.includes('int')) return 'integer';
  if (type.includes('小数') || type.includes('数值') || type.includes('decimal')) return 'decimal';
  if (type.includes('布尔') || type.includes('boolean')) return 'boolean';
  if (type.includes('日期') && type.includes('时间')) return 'datetime';
  if (type.includes('日期')) return 'date';
  if (type.includes('枚举')) return 'enum';
  if (type.includes('文本') || type.includes('text')) return 'text';
  if (type.includes('主键') || type.includes('外键')) return 'string';
  
  return 'string';
}
