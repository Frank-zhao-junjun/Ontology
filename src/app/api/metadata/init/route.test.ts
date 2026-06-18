import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('Metadata Init Route', () => {
  it('应返回本地化元数据清单', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.total).toBeGreaterThan(0);
    expect(payload.data[0]).toEqual(expect.objectContaining({
      domain: '物料',
      name: '物料唯一编码',
      nameEn: 'MATERIAL_ID',
      type: 'string',
    }));
  });

  it('应为同一元数据生成稳定ID，避免重载后断开模板引用', async () => {
    const firstResponse = await GET();
    const secondResponse = await GET();

    const firstPayload = await firstResponse.json();
    const secondPayload = await secondResponse.json();

    expect(firstPayload.data.map((item: { id: string }) => item.id)).toEqual(
      secondPayload.data.map((item: { id: string }) => item.id),
    );
  });
});