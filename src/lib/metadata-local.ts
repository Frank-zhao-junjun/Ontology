/**
 * 本地化元数据清单
 * 
 * 57 条标准元数据字段，来源于离散制造领域业务规范。
 * 替代原远程 Excel 下载方案，消除外部依赖。
 * 
 * 字段说明:
 * - domain: 领域分类
 * - name: 字段中文名
 * - nameEn: 字段英文名
 * - description: 业务含义
 * - type: 数据类型 (string|text|integer|decimal|boolean|date|datetime|enum)
 * - valueRange: 值范围/取值说明
 * - standard: 参考标准
 * - source: 信息源头
 */

export interface LocalMetadataItem {
  domain: string;
  name: string;
  nameEn: string;
  description: string;
  type: string;
  valueRange?: string;
  standard?: string;
  source?: string;
}

export const METADATA_LIST: LocalMetadataItem[] = [
  // ========== 物料领域 ==========
  { domain: "物料", name: "物料唯一编码", nameEn: "MATERIAL_ID", description: "全局唯一标识每一种物料", type: "string", valueRange: "自定义编码规则", standard: "GB/T 44063", source: "PLM/ERP" },
  { domain: "物料", name: "物料名称", nameEn: "MATERIAL_NAME", description: "物料的标准名称", type: "string", valueRange: "不超过200字符", source: "PLM" },
  { domain: "物料", name: "物料分类", nameEn: "MATERIAL_CATEGORY", description: "物料的分类层级", type: "enum", valueRange: "原材料/半成品/成品/辅料/包装物", source: "PLM" },
  { domain: "物料", name: "规格型号", nameEn: "SPECIFICATION", description: "物料的具体规格参数", type: "string", valueRange: "不超过500字符", source: "PLM" },
  { domain: "物料", name: "计量单位", nameEn: "UNIT_OF_MEASURE", description: "物料的标准计量单位", type: "enum", valueRange: "个/千克/米/升/箱", standard: "GB/T 15261", source: "PLM/ERP" },
  { domain: "物料", name: "物料状态", nameEn: "MATERIAL_STATUS", description: "物料的生命周期状态", type: "enum", valueRange: "草稿/生效/停用/废弃", source: "PLM" },
  { domain: "物料", name: "安全库存量", nameEn: "SAFETY_STOCK", description: "触发补货的最低库存阈值", type: "decimal", valueRange: "≥0", source: "ERP/WMS" },
  { domain: "物料", name: "物料版本号", nameEn: "MATERIAL_VERSION", description: "物料的设计/工艺版本", type: "string", valueRange: "V{major}.{minor}", source: "PLM" },

  // ========== 生产领域 ==========
  { domain: "生产", name: "工单编号", nameEn: "WORK_ORDER_ID", description: "生产工单的唯一标识", type: "string", valueRange: "WO-{YYYYMMDD}-{seq}", source: "MES/ERP" },
  { domain: "生产", name: "工单状态", nameEn: "WORK_ORDER_STATUS", description: "工单当前执行状态", type: "enum", valueRange: "已创建/已下达/执行中/已完工/已关闭", source: "MES" },
  { domain: "生产", name: "计划开始时间", nameEn: "PLANNED_START_TIME", description: "工单计划开工时间", type: "datetime", source: "APS/ERP" },
  { domain: "生产", name: "计划结束时间", nameEn: "PLANNED_END_TIME", description: "工单计划完工时间", type: "datetime", source: "APS/ERP" },
  { domain: "生产", name: "实际开始时间", nameEn: "ACTUAL_START_TIME", description: "工单实际开工时间", type: "datetime", source: "MES" },
  { domain: "生产", name: "实际结束时间", nameEn: "ACTUAL_END_TIME", description: "工单实际完工时间", type: "datetime", source: "MES" },
  { domain: "生产", name: "生产数量", nameEn: "PRODUCTION_QUANTITY", description: "工单计划生产数量", type: "decimal", valueRange: ">0", source: "ERP" },
  { domain: "生产", name: "合格数量", nameEn: "QUALIFIED_QUANTITY", description: "检验合格的数量", type: "decimal", valueRange: "≥0", source: "MES/QMS" },
  { domain: "生产", name: "不合格数量", nameEn: "DEFECTIVE_QUANTITY", description: "检验不合格的数量", type: "decimal", valueRange: "≥0", source: "MES/QMS" },
  { domain: "生产", name: "生产线", nameEn: "PRODUCTION_LINE", description: "执行生产的具体产线", type: "string", source: "MES" },
  { domain: "生产", name: "工艺路线", nameEn: "ROUTING_ID", description: "产品加工的工艺流程", type: "string", source: "PLM/MES" },

  // ========== 质量领域 ==========
  { domain: "质量", name: "检验批号", nameEn: "INSPECTION_LOT_ID", description: "质量检验批的唯一标识", type: "string", source: "QMS" },
  { domain: "质量", name: "检验类型", nameEn: "INSPECTION_TYPE", description: "检验的具体类型", type: "enum", valueRange: "来料检验/过程检验/成品检验/出货检验", source: "QMS" },
  { domain: "质量", name: "检验结果", nameEn: "INSPECTION_RESULT", description: "检验批的判定结果", type: "enum", valueRange: "合格/不合格/让步接收/待复检", source: "QMS" },
  { domain: "质量", name: "缺陷代码", nameEn: "DEFECT_CODE", description: "缺陷类型的编码", type: "string", valueRange: "参照缺陷代码表", source: "QMS" },
  { domain: "质量", name: "缺陷等级", nameEn: "DEFECT_SEVERITY", description: "缺陷的严重程度", type: "enum", valueRange: "致命/严重/一般/轻微", standard: "GB/T 2828", source: "QMS" },
  { domain: "质量", name: "检验时间", nameEn: "INSPECTION_TIME", description: "检验执行的时间", type: "datetime", source: "QMS" },
  { domain: "质量", name: "检验员", nameEn: "INSPECTOR", description: "执行检验的人员", type: "string", source: "QMS" },

  // ========== 采购领域 ==========
  { domain: "采购", name: "采购订单编号", nameEn: "PURCHASE_ORDER_ID", description: "采购订单唯一标识", type: "string", valueRange: "PO-{YYYYMMDD}-{seq}", source: "ERP/SRM" },
  { domain: "采购", name: "采购订单状态", nameEn: "PURCHASE_ORDER_STATUS", description: "采购订单当前状态", type: "enum", valueRange: "草稿/已审批/已发送/部分收货/已完成/已关闭", source: "ERP/SRM" },
  { domain: "采购", name: "供应商编码", nameEn: "SUPPLIER_ID", description: "供应商的唯一标识", type: "string", source: "ERP/SRM" },
  { domain: "采购", name: "供应商名称", nameEn: "SUPPLIER_NAME", description: "供应商的标准名称", type: "string", source: "SRM" },
  { domain: "采购", name: "采购数量", nameEn: "PURCHASE_QUANTITY", description: "采购订单行项目的数量", type: "decimal", valueRange: ">0", source: "ERP" },
  { domain: "采购", name: "采购单价", nameEn: "PURCHASE_UNIT_PRICE", description: "采购订单行项目的含税单价", type: "decimal", valueRange: "≥0, 保留4位小数", source: "ERP" },
  { domain: "采购", name: "交货日期", nameEn: "DELIVERY_DATE", description: "供应商承诺的交货日期", type: "date", source: "ERP/SRM" },

  // ========== 销售领域 ==========
  { domain: "销售", name: "销售订单编号", nameEn: "SALES_ORDER_ID", description: "销售订单唯一标识", type: "string", valueRange: "SO-{YYYYMMDD}-{seq}", source: "ERP/CRM" },
  { domain: "销售", name: "销售订单状态", nameEn: "SALES_ORDER_STATUS", description: "销售订单当前状态", type: "enum", valueRange: "草稿/已确认/已发货/部分签收/已完成/已取消", source: "ERP/CRM" },
  { domain: "销售", name: "客户编码", nameEn: "CUSTOMER_ID", description: "客户的唯一标识", type: "string", source: "ERP/CRM" },
  { domain: "销售", name: "客户名称", nameEn: "CUSTOMER_NAME", description: "客户的标准名称", type: "string", source: "CRM" },
  { domain: "销售", name: "销售数量", nameEn: "SALES_QUANTITY", description: "销售订单行项目的数量", type: "decimal", valueRange: ">0", source: "ERP" },
  { domain: "销售", name: "销售单价", nameEn: "SALES_UNIT_PRICE", description: "销售订单行项目的含税单价", type: "decimal", valueRange: "≥0, 保留2位小数", source: "ERP" },
  { domain: "销售", name: "承诺交期", nameEn: "PROMISED_DELIVERY_DATE", description: "向客户承诺的交付日期", type: "date", source: "ERP/CRM" },

  // ========== 仓储领域 ==========
  { domain: "仓储", name: "仓库编码", nameEn: "WAREHOUSE_ID", description: "仓库的唯一标识", type: "string", source: "WMS" },
  { domain: "仓储", name: "库位编码", nameEn: "LOCATION_ID", description: "仓库内具体库位标识", type: "string", valueRange: "{仓}-{区}-{排}-{列}-{层}", source: "WMS" },
  { domain: "仓储", name: "库存数量", nameEn: "STOCK_QUANTITY", description: "某物料在指定库位的实时库存", type: "decimal", valueRange: "≥0", source: "WMS" },
  { domain: "仓储", name: "库存状态", nameEn: "STOCK_STATUS", description: "库存的质量/冻结状态", type: "enum", valueRange: "可用/冻结/质检中/报废", source: "WMS" },
  { domain: "仓储", name: "批次号", nameEn: "BATCH_NUMBER", description: "物料的生产批次标识", type: "string", source: "MES/WMS" },
  { domain: "仓储", name: "入库时间", nameEn: "INBOUND_TIME", description: "物料入库的时间", type: "datetime", source: "WMS" },
  { domain: "仓储", name: "出库时间", nameEn: "OUTBOUND_TIME", description: "物料出库的时间", type: "datetime", source: "WMS" },

  // ========== 财务领域 ==========
  { domain: "财务", name: "成本中心", nameEn: "COST_CENTER", description: "费用归属的成本中心编码", type: "string", source: "ERP/FICO" },
  { domain: "财务", name: "利润中心", nameEn: "PROFIT_CENTER", description: "收入归属的利润中心编码", type: "string", source: "ERP/FICO" },
  { domain: "财务", name: "科目编码", nameEn: "ACCOUNT_CODE", description: "财务科目的统一编码", type: "string", standard: "企业会计准则", source: "ERP/FICO" },
  { domain: "财务", name: "金额", nameEn: "AMOUNT", description: "交易或核算的货币金额", type: "decimal", valueRange: "≥0, 保留2位小数", source: "ERP/FICO" },
  { domain: "财务", name: "币种", nameEn: "CURRENCY", description: "金额的货币类型", type: "enum", valueRange: "CNY/USD/EUR/JPY", standard: "ISO 4217", source: "ERP" },
  { domain: "财务", name: "税率", nameEn: "TAX_RATE", description: "适用的增值税税率", type: "decimal", valueRange: "0/0.06/0.09/0.13", standard: "增值税暂行条例", source: "ERP" },
  { domain: "财务", name: "凭证编号", nameEn: "VOUCHER_ID", description: "会计凭证的唯一标识", type: "string", source: "ERP/FICO" },

  // ========== 设备领域 ==========
  { domain: "设备", name: "设备编码", nameEn: "EQUIPMENT_ID", description: "设备的唯一标识编码", type: "string", source: "EAM/MES" },
  { domain: "设备", name: "设备名称", nameEn: "EQUIPMENT_NAME", description: "设备的标准名称", type: "string", source: "EAM" },
  { domain: "设备", name: "设备状态", nameEn: "EQUIPMENT_STATUS", description: "设备当前运行状态", type: "enum", valueRange: "运行/待机/维修/停机/报废", source: "EAM/MES" },
  { domain: "设备", name: "上次维保日期", nameEn: "LAST_MAINTENANCE_DATE", description: "设备上次维护保养的日期", type: "date", source: "EAM" },
  { domain: "设备", name: "下次维保日期", nameEn: "NEXT_MAINTENANCE_DATE", description: "设备下次计划维护保养的日期", type: "date", source: "EAM" },
];
