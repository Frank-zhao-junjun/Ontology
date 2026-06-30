import { beforeEach, describe, expect, it, vi } from 'vitest';
import { METADATA_LIST } from '@/lib/metadata-local';
import { generateId } from '@/lib/id';
import { GET } from './route';

vi.mock('@/lib/id', () => ({
  generateId: vi.fn(() => 'mock-id'),
}));

describe('Metadata Init Route', () => {
  beforeEach(() => {
    vi.mocked(generateId).mockReturnValue('mock-id');
  });

  it('应返回本地元数据清单并映射字段类型', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.total).toBe(METADATA_LIST.length);
    expect(payload.data).toHaveLength(METADATA_LIST.length);

    const first = payload.data[0];
    expect(first).toEqual(expect.objectContaining({
      id: 'mock-id0',
      domain: METADATA_LIST[0].domain,
      name: METADATA_LIST[0].name,
      nameEn: METADATA_LIST[0].nameEn,
      description: METADATA_LIST[0].description,
      type: METADATA_LIST[0].type,
      valueRange: METADATA_LIST[0].valueRange || '',
      standard: METADATA_LIST[0].standard || '',
      source: METADATA_LIST[0].source || '',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }));
  });

  it('应包含已知的制造领域字段', async () => {
    const response = await GET();
    const payload = await response.json();

    const materialName = payload.data.find((item: { nameEn: string }) => item.nameEn === 'MATERIAL_ID');
    expect(materialName).toBeDefined();
    expect(materialName.type).toBe('string');
    expect(materialName.domain).toBe('物料');

    const amount = payload.data.find((item: { nameEn: string }) => item.nameEn === 'AMOUNT');
    expect(amount).toBeDefined();
    expect(amount.type).toBe('decimal');
    expect(amount.domain).toBe('财务');
  });
});
