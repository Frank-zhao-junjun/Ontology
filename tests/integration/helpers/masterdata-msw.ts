import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

export const materialDefinition = {
  id: 'md-material',
  domain: '研发管理',
  name: '物料主数据',
  nameEn: 'MaterialMaster',
  code: 'MATERIAL',
  description: '物料基础信息',
  coreData: '是',
  fieldNames: '物料编码,物料名称,状态',
  sourceSystem: 'ERP',
  apiUrl: '',
  status: '00' as const,
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
};

export function mockMasterdataInit(
  records: Record<string, unknown[]> = { 'md-material': [] },
  definitions: typeof materialDefinition[] = [materialDefinition],
) {
  server.use(
    http.get('/api/masterdata/init', () =>
      HttpResponse.json({
        success: true,
        data: { definitions, records },
      }),
    ),
  );
}
