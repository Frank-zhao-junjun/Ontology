import { NextResponse } from 'next/server';
import type { ExcelTemplateSheet } from '@/types/ontology';

const TEMPLATE_SHEETS: ExcelTemplateSheet[] = [
  {
    name: '实体',
    nameEn: 'entities',
    headers: [
      { label: '实体名称(必填)', key: 'name', required: true, type: 'string', description: '实体的中文名称' },
      { label: '英文名称(必填)', key: 'nameEn', required: true, type: 'string', description: '实体的英文标识' },
      { label: '实体角色', key: 'entityRole', required: false, type: 'enum', enumValues: ['aggregate_root', 'child_entity'], description: '聚合根或子实体，默认aggregate_root' },
      { label: '父聚合ID', key: 'parentAggregateId', required: false, type: 'string', description: '子实体时填写父聚合根的英文名称' },
      { label: '项目名称', key: 'projectName', required: false, type: 'string', description: '归属项目' },
      { label: '业务场景', key: 'businessScenarioName', required: false, type: 'string', description: '归属业务场景' },
      { label: '描述', key: 'description', required: false, type: 'string', description: '实体描述' },
      { label: '业务含义', key: 'businessMeaning', required: false, type: 'string', description: '供AI理解的精确业务定义' },
      { label: '同义词(逗号分隔)', key: 'aliases', required: false, type: 'string', description: '多个同义词用逗号隔开' },
    ],
  },
  {
    name: '属性',
    nameEn: 'attributes',
    headers: [
      { label: '实体英文名称(必填)', key: 'entityNameEn', required: true, type: 'string', description: '归属实体的英文标识' },
      { label: '属性名称(必填)', key: 'name', required: true, type: 'string', description: '属性中文名称' },
      { label: '英文名称(必填)', key: 'nameEn', required: true, type: 'string', description: '属性英文标识' },
      { label: '数据类型(必填)', key: 'dataType', required: true, type: 'enum', enumValues: ['string', 'text', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'enum', 'reference'], description: '9种数据类型' },
      { label: '必填', key: 'required', required: false, type: 'boolean', description: 'true/false' },
      { label: '唯一', key: 'unique', required: false, type: 'boolean', description: 'true/false' },
      { label: '长度', key: 'length', required: false, type: 'number', description: 'string类型长度' },
      { label: '精度', key: 'precision', required: false, type: 'number', description: 'decimal精度' },
      { label: '小数位', key: 'scale', required: false, type: 'number', description: 'decimal小数位' },
      { label: '默认值', key: 'default', required: false, type: 'string', description: '默认值' },
      { label: '引用实体英文名', key: 'referencedEntityNameEn', required: false, type: 'string', description: 'reference类型时填写' },
      { label: '引用类型', key: 'referenceKind', required: false, type: 'enum', enumValues: ['entityRef', 'masterDataRef'], description: '引用类型' },
      { label: '主数据类型', key: 'masterDataType', required: false, type: 'string', description: 'masterDataRef时填写' },
      { label: '枚举引用', key: 'enumRef', required: false, type: 'string', description: 'enum类型时填写状态机名.状态名' },
      { label: '描述', key: 'description', required: false, type: 'string', description: '属性描述' },
      { label: '业务含义', key: 'businessMeaning', required: false, type: 'string', description: '供AI理解的精确业务定义' },
      { label: '元数据模板名', key: 'metadataTemplateName', required: false, type: 'string', description: '绑定的元数据模板名称' },
    ],
  },
  {
    name: '关系',
    nameEn: 'relations',
    headers: [
      { label: '源实体英文名称(必填)', key: 'sourceEntityNameEn', required: true, type: 'string', description: '关系源实体的英文标识' },
      { label: '关系名称(必填)', key: 'name', required: true, type: 'string', description: '关系中文名称' },
      { label: '关系类型(必填)', key: 'type', required: true, type: 'enum', enumValues: ['one_to_one', 'one_to_many', 'many_to_many'], description: '关系类型' },
      { label: '目标实体英文名称(必填)', key: 'targetEntityNameEn', required: true, type: 'string', description: '目标实体英文标识' },
      { label: '外键字段', key: 'foreignKey', required: false, type: 'string', description: '外键字段名' },
      { label: '中间实体', key: 'viaEntity', required: false, type: 'string', description: '多对多时中间实体英文名' },
      { label: '级联', key: 'cascade', required: false, type: 'enum', enumValues: ['none', 'delete', 'all'], description: '级联删除策略' },
      { label: '递归关系', key: 'isRecursive', required: false, type: 'boolean', description: 'true/false' },
      { label: '方向性', key: 'directionality', required: false, type: 'enum', enumValues: ['directed', 'undirected'], description: '有向/无向' },
      { label: '描述', key: 'description', required: false, type: 'string', description: '关系描述' },
    ],
  },
  {
    name: '状态机',
    nameEn: 'stateMachines',
    headers: [
      { label: '实体英文名称(必填)', key: 'entityNameEn', required: true, type: 'string', description: '归属实体英文标识' },
      { label: '状态机名称(必填)', key: 'name', required: true, type: 'string', description: '状态机名称' },
      { label: '状态字段', key: 'statusField', required: false, type: 'string', description: '默认status' },
      { label: '状态名称(必填)', key: 'stateName', required: true, type: 'string', description: '状态名称，多个状态用分号分隔' },
      { label: '是否初始状态', key: 'isInitial', required: false, type: 'string', description: '初始状态名称' },
      { label: '是否终止状态', key: 'isFinal', required: false, type: 'string', description: '终止状态名称，多个用分号分隔' },
      { label: '转换名称', key: 'transitionName', required: false, type: 'string', description: '转换名称，多个用分号分隔' },
      { label: '转换从→到', key: 'transitionFromTo', required: false, type: 'string', description: '格式: 状态A→状态B;状态B→状态C' },
      { label: '触发类型', key: 'triggerType', required: false, type: 'enum', enumValues: ['manual', 'automatic', 'scheduled'], description: '多个用分号分隔，与转换一一对应' },
    ],
  },
  {
    name: '规则',
    nameEn: 'rules',
    headers: [
      { label: '实体英文名称(必填)', key: 'entityNameEn', required: true, type: 'string', description: '归属实体英文标识' },
      { label: '规则名称(必填)', key: 'name', required: true, type: 'string', description: '规则名称' },
      { label: '规则类型(必填)', key: 'type', required: true, type: 'enum', enumValues: ['field_validation', 'cross_field_validation', 'cross_entity_validation', 'aggregation_validation', 'temporal_rule'], description: '5种规则类型' },
      { label: '字段', key: 'field', required: false, type: 'string', description: '校验字段名' },
      { label: '条件类型', key: 'conditionType', required: false, type: 'enum', enumValues: ['regex', 'range', 'expression', 'reference_check', 'sum_match', 'deadline', 'custom'], description: '条件类型' },
      { label: '条件值', key: 'conditionValue', required: false, type: 'string', description: '正则/范围/表达式等' },
      { label: '严重程度', key: 'severity', required: false, type: 'enum', enumValues: ['error', 'warning', 'info'], description: '默认error' },
      { label: '错误消息(必填)', key: 'errorMessage', required: true, type: 'string', description: '校验失败时的提示' },
      { label: '优先级', key: 'priority', required: false, type: 'number', description: '默认100' },
      { label: '启用', key: 'enabled', required: false, type: 'boolean', description: 'true/false，默认true' },
      { label: '描述', key: 'description', required: false, type: 'string', description: '规则描述' },
    ],
  },
  {
    name: '事件',
    nameEn: 'events',
    headers: [
      { label: '实体英文名称(必填)', key: 'entityNameEn', required: true, type: 'string', description: '归属聚合根英文标识' },
      { label: '事件名称(必填)', key: 'name', required: true, type: 'string', description: '需包含"已"字表示过去时态' },
      { label: '英文名称', key: 'nameEn', required: false, type: 'string', description: '事件英文标识' },
      { label: '触发时机(必填)', key: 'trigger', required: true, type: 'enum', enumValues: ['create', 'update', 'delete', 'state_change', 'custom'], description: '事件触发时机' },
      { label: '条件', key: 'condition', required: false, type: 'string', description: 'state_change时的条件表达式' },
      { label: '事务阶段', key: 'transactionPhase', required: false, type: 'enum', enumValues: ['BEFORE_COMMIT', 'AFTER_COMMIT'], description: '默认AFTER_COMMIT' },
      { label: '领域事件', key: 'isDomainEvent', required: false, type: 'boolean', description: 'true/false，默认true' },
      { label: '载荷字段(逗号分隔)', key: 'payloadFields', required: false, type: 'string', description: '领域事件载荷字段，最多5个' },
      { label: '描述', key: 'description', required: false, type: 'string', description: '事件描述' },
    ],
  },
  {
    name: '部门',
    nameEn: 'departments',
    headers: [
      { label: '部门名称(必填)', key: 'name', required: true, type: 'string', description: '部门中文名称' },
      { label: '英文名称(必填)', key: 'nameEn', required: true, type: 'string', description: '部门英文标识' },
      { label: '部门编码', key: 'code', required: false, type: 'string', description: '唯一编码，用于跨Sheet引用；不填则自动生成' },
      { label: '部门类型', key: 'type', required: false, type: 'enum', enumValues: ['headquarters', 'division', 'department', 'team', 'group'], description: '默认department' },
      { label: '上级部门编码', key: 'parentCode', required: false, type: 'string', description: '引用本Sheet中其他部门的编码' },
      { label: '负责人岗位编码', key: 'managerPositionCode', required: false, type: 'string', description: '引用岗位Sheet的岗位编码' },
      { label: '描述', key: 'description', required: false, type: 'string', description: '部门描述' },
      { label: '排序', key: 'sortOrder', required: false, type: 'number', description: '同级排序，数字越小越靠前' },
      { label: '状态', key: 'status', required: false, type: 'enum', enumValues: ['active', 'inactive'], description: '默认active' },
    ],
  },
  {
    name: '岗位',
    nameEn: 'positions',
    headers: [
      { label: '岗位名称(必填)', key: 'name', required: true, type: 'string', description: '岗位中文名称' },
      { label: '英文名称(必填)', key: 'nameEn', required: true, type: 'string', description: '岗位英文标识' },
      { label: '岗位编码', key: 'code', required: false, type: 'string', description: '唯一编码，用于跨Sheet引用' },
      { label: '所属部门编码(必填)', key: 'departmentCode', required: true, type: 'string', description: '引用部门Sheet的部门编码' },
      { label: '上级岗位编码', key: 'parentPositionCode', required: false, type: 'string', description: '引用本Sheet中其他岗位的编码' },
      { label: '层级', key: 'level', required: false, type: 'number', description: '岗位层级，正整数' },
      { label: '关联角色(分号分隔)', key: 'roleNames', required: false, type: 'string', description: 'GovernanceRole名称，多个用分号分隔' },
      { label: '编制人数', key: 'headcount', required: false, type: 'number', description: '该岗位的编制人数' },
      { label: '职责_名称(分号分隔)', key: 'respNames', required: false, type: 'string', description: '职责名称，多个用分号分隔' },
      { label: '职责_范围(分号分隔)', key: 'respScopes', required: false, type: 'string', description: 'entity/process/domain/custom，与名称一一对应' },
      { label: '职责_范围引用(分号分隔)', key: 'respScopeRefs', required: false, type: 'string', description: '范围引用的ID或英文名，内部用逗号分隔' },
      { label: '职责_操作(分号分隔)', key: 'respActions', required: false, type: 'string', description: 'Action英文名或ID，内部用逗号分隔' },
      { label: '职责_决策权限(分号分隔)', key: 'respDecisionAuthorities', required: false, type: 'string', description: 'none/recommend/approve/veto，与名称一一对应' },
      { label: '职责_委托岗位(分号分隔)', key: 'respDelegates', required: false, type: 'string', description: '委托岗位编码，内部用逗号分隔' },
      { label: '状态', key: 'status', required: false, type: 'enum', enumValues: ['active', 'inactive'], description: '默认active' },
    ],
  },
];

export async function GET() {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // 填写说明 Sheet
  const instrData = [
    ['Ontology 建模数据导入模板 — 填写说明'],
    [''],
    ['1. 本模板包含8个Sheet：实体、属性、关系、状态机、规则、事件、部门、岗位'],
    ['2. 必填字段标有"(必填)"，未填写将导致校验失败'],
    ['3. 枚举类型字段只能填写指定值，见列说明'],
    ['4. 多个值用分号(;)或逗号(,)分隔，具体见各字段说明'],
    ['5. 英文名称(nameEn)用于跨Sheet引用，必须保持一致'],
    ['6. 实体角色: aggregate_root=聚合根, child_entity=子实体'],
    ['7. 只有聚合根实体才能定义事件'],
    ['8. 上传后系统会自动校验，通过后生成待审核版本'],
    [''],
    ['Sheet说明:'],
    ['实体: 定义本体实体（聚合根/子实体）'],
    ['属性: 定义实体属性，需指定归属实体英文名称'],
    ['关系: 定义实体间关系，需指定源和目标实体英文名称'],
    ['状态机: 定义实体状态机、状态和转换'],
    ['规则: 定义校验规则'],
    ['事件: 定义领域事件，仅限聚合根实体'],
    ['部门: 定义组织部门（支持树形结构，通过上级部门编码关联）'],
    ['岗位: 定义组织岗位（关联部门和角色，支持结构化职责）'],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
  wsInstr['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, '填写说明');

  // 数据 Sheet
  for (const sheet of TEMPLATE_SHEETS) {
    const headerRow = sheet.headers.map(h => h.label);
    // 描述行用 #DESC# 标记前缀，导入时会自动跳过
    const descRow = sheet.headers.map(h => `#DESC#${h.description}`);
    // 示例行用 #EXAMPLE# 标记首列前缀，导入时会自动跳过
    const rawExample = getExampleRow(sheet.nameEn);
    const exampleRow = rawExample.length > 0
      ? [`#EXAMPLE#${rawExample[0]}`, ...rawExample.slice(1)]
      : [];

    const data = [headerRow, descRow, exampleRow];
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 列宽
    ws['!cols'] = sheet.headers.map(h => ({
      wch: Math.max(h.label.length * 2, 15),
    }));

    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="ontology-import-template.xlsx"',
    },
  });
}

function getExampleRow(sheetName: string): string[] {
  switch (sheetName) {
    case 'entities':
      return ['物料', 'Material', 'aggregate_root', '', '生产管理', '核心物料管理', '全局唯一标识每一种物料', '物料/物项/材料', '物料主数据'];
    case 'attributes':
      return ['Material', '物料编码', 'materialCode', 'string', 'true', 'true', '50', '', '', '', '', '', '', '', '全局唯一标识', '物料唯一编码', 'MATERIAL_ID'];
    case 'relations':
      return ['Material', '包含BOM项', 'one_to_many', 'BomItem', 'materialId', '', 'none', '', 'directed', '物料包含的BOM清单'];
    case 'stateMachines':
      return ['Material', '物料生命周期', 'status', '草稿;已发布;已归档', '草稿', '已归档', '发布;归档', '草稿→已发布;已发布→已归档', 'manual;manual'];
    case 'rules':
      return ['Material', '物料编码格式校验', 'field_validation', 'materialCode', 'regex', '^[A-Z]{2}\\d{6}$', 'error', '物料编码必须为2位大写字母+6位数字', '100', 'true', '物料编码格式规范'];
    case 'events':
      return ['Material', '物料已创建', 'MaterialCreated', 'create', '', 'AFTER_COMMIT', 'true', 'materialCode,name', '新物料创建事件'];
    case 'departments':
      return ['生产管理部', 'ProductionDept', 'DEPT-PROD', 'department', '', '', '负责生产计划与调度', '10', 'active'];
    case 'positions':
      return ['生产主管', 'ProductionManager', 'POS-MGR-01', 'DEPT-PROD', '', '3', '生产经理', '2', '生产计划审批', 'process', 'ProductionPlan', 'approvePlan', 'approve', '', 'active'];
    default:
      return [];
  }
}
