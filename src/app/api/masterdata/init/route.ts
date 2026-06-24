import { NextRequest, NextResponse } from 'next/server';
import { FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// 主数据文件 URL 可通过环境变量覆盖，默认仍回落到示例数据。
const MASTERDATA_EXCEL_URL = process.env.MASTERDATA_EXCEL_URL || '';

const generateId = () => Math.random().toString(36).substring(2, 10);

// 示例主数据（当没有Excel文件时使用）
const SAMPLE_MASTERDATA = [
  {
    id: generateId(),
    domain: '采购管理',
    name: '供应商主数据',
    nameEn: 'VendorMaster',
    code: 'VENDOR',
    description: '供应商基础信息，包括名称、地址、联系方式、付款条款等',
    coreData: '是',
    fieldNames: '供应商编码,供应商名称,地址,联系人,联系电话,付款条款',
    sourceSystem: 'SAP',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    domain: '采购管理',
    name: '采购信息记录',
    nameEn: 'InfoRecord',
    code: 'INFO_REC',
    description: '物料与供应商的采购关系记录',
    coreData: '是',
    fieldNames: '物料编码,供应商编码,采购组,价格,交货周期',
    sourceSystem: 'SAP',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    domain: '采购管理',
    name: '货源清单',
    nameEn: 'SourceList',
    code: 'SRC_LIST',
    description: '物料可采购的供应商清单',
    coreData: '否',
    fieldNames: '物料编码,工厂,供应商编码,有效期开始,有效期结束',
    sourceSystem: 'SAP',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    domain: '销售管理',
    name: '客户主数据',
    nameEn: 'CustomerMaster',
    code: 'CUSTOMER',
    description: '客户基础信息，包括名称、地址、联系方式、信用额度等',
    coreData: '是',
    fieldNames: '客户编码,客户名称,地址,联系人,联系电话,信用额度',
    sourceSystem: 'SAP',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    domain: '销售管理',
    name: '价格主数据',
    nameEn: 'PriceMaster',
    code: 'PRICE',
    description: '产品销售价格信息',
    coreData: '是',
    fieldNames: '产品编码,客户组,价格组,币种,价格,有效期',
    sourceSystem: 'SAP',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    domain: '研发管理',
    name: '物料主数据',
    nameEn: 'MaterialMaster',
    code: 'MATERIAL',
    description: '物料基础信息，包括编码、名称、规格、单位、分类等',
    coreData: '是',
    fieldNames: '物料编码,物料名称,物料描述,基本单位,物料组,物料类型',
    sourceSystem: 'SAP',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    domain: '生产管理',
    name: '物料清单(BOM)',
    nameEn: 'BOM',
    code: 'BOM',
    description: '产品结构和物料组成关系',
    coreData: '是',
    fieldNames: '父物料编码,子物料编码,数量,单位,工序,有效期',
    sourceSystem: 'SAP',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    domain: '生产管理',
    name: '工作中心',
    nameEn: 'WorkCenter',
    code: 'WC',
    description: '生产资源和工作中心定义',
    coreData: '是',
    fieldNames: '工作中心编码,工作中心名称,成本中心,产能,效率',
    sourceSystem: 'SAP',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    domain: '财务管理',
    name: '会计科目主数据',
    nameEn: 'GLAccount',
    code: 'GL_ACCT',
    description: '总账科目定义',
    coreData: '是',
    fieldNames: '科目编码,科目名称,科目类型,借贷方向,余额方向',
    sourceSystem: 'SAP',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    domain: '财务管理',
    name: '成本中心',
    nameEn: 'CostCenter',
    code: 'COST_CTR',
    description: '成本归集和分析单元',
    coreData: '是',
    fieldNames: '成本中心编码,成本中心名称,负责人,部门,利润中心',
    sourceSystem: 'SAP',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    domain: '设备管理',
    name: '设备台账主数据',
    nameEn: 'EquipmentMaster',
    code: 'EQUIP',
    description: '设备基础信息和资产管理',
    coreData: '是',
    fieldNames: '设备编码,设备名称,设备类型,购置日期,原值,使用状态',
    sourceSystem: 'SAP',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    domain: '人力资源管理',
    name: '部门主数据',
    nameEn: 'DepartmentMaster',
    code: 'DEPT',
    description: '组织架构和部门信息',
    coreData: '是',
    fieldNames: '部门编码,部门名称,上级部门,部门负责人,成本中心',
    sourceSystem: 'HR',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    domain: '人力资源管理',
    name: '员工主数据',
    nameEn: 'EmployeeMaster',
    code: 'EMP',
    description: '员工基本信息和人事档案',
    coreData: '是',
    fieldNames: '员工编码,姓名,部门,岗位,入职日期,状态',
    sourceSystem: 'HR',
    apiUrl: '',
    status: '00' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SAMPLE_MASTERDATA_RECORDS = (() => {
  const byCode = Object.fromEntries(SAMPLE_MASTERDATA.map((item) => [item.code, item.id]));
  const now = new Date().toISOString();

  return {
    [byCode.MATERIAL || 'MATERIAL']: [
      {
        id: generateId(),
        definitionId: byCode.MATERIAL || 'MATERIAL',
        values: {
          物料编码: 'M-001',
          物料名称: '钢材Q235A',
          物料描述: '热轧钢板',
          基本单位: 'KG',
          物料组: '原材料',
          物料类型: '钢材',
        },
        status: '00' as const,
        createdAt: now,
        updatedAt: now,
      },
    ],
    [byCode.VENDOR || 'VENDOR']: [
      {
        id: generateId(),
        definitionId: byCode.VENDOR || 'VENDOR',
        values: {
          供应商编码: 'V-001',
          供应商名称: '汉商沃芽科技',
          地址: '武汉',
          联系人: '张经理',
          联系电话: '13800000000',
          付款条款: '月结30天',
        },
        status: '00' as const,
        createdAt: now,
        updatedAt: now,
      },
    ],
  } as Record<string, Array<{
    id: string;
    definitionId: string;
    values: Record<string, string>;
    status: '00' | '99';
    createdAt: string;
    updatedAt: string;
  }>>;
})();

export async function GET(request: NextRequest) {
  try {
    // 如果有Excel文件URL，尝试从Excel加载
    if (MASTERDATA_EXCEL_URL) {
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
      const config = new Config();
      const client = new FetchClient(config, customHeaders);

      const response = await client.fetch(MASTERDATA_EXCEL_URL);

      if (response.status_code === 0) {
        const textContent = response.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n');

        const masterData = parseMarkdownTable(textContent);
        if (masterData.length > 0) {
          return NextResponse.json({
            success: true,
            data: {
              definitions: masterData,
              records: buildEmptyRecordMap(masterData),
            },
            total: masterData.length
          });
        }
      }
    }

    // 返回示例数据
    return NextResponse.json({
      success: true,
      data: {
        definitions: SAMPLE_MASTERDATA,
        records: SAMPLE_MASTERDATA_RECORDS,
      },
      total: SAMPLE_MASTERDATA.length
    });

  } catch (error) {
    console.error('Fetch masterdata error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取主数据失败' },
      { status: 500 }
    );
  }
}

// 解析Markdown表格格式
interface MasterDataRow {
  [key: string]: string;
}

function parseMarkdownTable(content: string): MasterDataRow[] {
  const lines = content.split('\n').filter(line => line.trim());
  const masterData: MasterDataRow[] = [];

  // 查找表头行
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('主数据中文名') || lines[i].includes('主数据名称')) {
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

      // 只添加有效数据行
      if (row['主数据中文名'] || row['主数据名称'] || row['中文名称']) {
        masterData.push({
          id: generateId(),
          domain: row['领域'] || row['业务领域'] || '',
          name: row['主数据中文名'] || row['主数据名称'] || row['中文名称'] || '',
          nameEn: row['主数据英文名'] || row['英文名称'] || '',
          code: row['编码'] || row['主数据编码'] || '',
          description: row['备注'] || row['说明'] || row['描述'] || '',
          coreData: row['核心主数据'] || '否',
          fieldNames: row['字段名'] || row['字段清单'] || row['字段列表'] || '',
          sourceSystem: row['来源系统'] || '',
          apiUrl: row['API URL'] || '',
          status: '00' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  return masterData;
}

// 解析Markdown表格行
function parseMarkdownRow(line: string): string[] {
  let content = line.trim();
  if (content.startsWith('|')) content = content.slice(1);
  if (content.endsWith('|')) content = content.slice(0, -1);
  return content.split('|').map(cell => cell.trim());
}

function buildEmptyRecordMap(masterData: Array<{ id?: string }>): Record<string, unknown[]> {
  return masterData.reduce<Record<string, unknown[]>>((acc, item, index) => {
    const key = item.id || `masterdata-${index}`;
    acc[key] = [];
    return acc;
  }, {});
}
