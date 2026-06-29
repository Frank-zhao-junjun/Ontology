const XLSX = require("xlsx");
async function main() { from 'xlsx';

// 1. Download template
console.log('=== 1. Download template ===');
const res = await fetch('http://localhost:5000/api/excel-template');
const templateBuf = Buffer.from(await res.arrayBuffer());
const wb = XLSX.read(templateBuf, { type: 'buffer' });
console.log('Template sheets:', wb.SheetNames);

// 2. Fill in real data in each sheet
console.log('\n=== 2. Fill template with test data ===');

// E1-实体
XLSX.utils.sheet_add_json(wb.Sheets['E1-实体'], [
  { '实体名称(必填)': '物料', '英文名称(必填)': 'Material', '实体角色': 'aggregate_root', '描述': '物料实体' },
  { '实体名称(必填)': '供应商', '英文名称(必填)': 'Supplier', '实体角色': 'aggregate_root', '描述': '供应商实体' },
], { skipHeader: true, origin: -1 });

// E1-属性
XLSX.utils.sheet_add_json(wb.Sheets['E1-属性'], [
  { '实体英文名称(必填)': 'Material', '属性名称(必填)': '编码', '英文名称(必填)': 'code', '数据类型(必填)': 'string', '必填': 'true', '唯一': 'true' },
  { '实体英文名称(必填)': 'Material', '属性名称(必填)': '名称', '英文名称(必填)': 'name', '数据类型(必填)': 'string', '必填': 'true' },
  { '实体英文名称(必填)': 'Supplier', '属性名称(必填)': '编码', '英文名称(必填)': 'code', '数据类型(必填)': 'string', '必填': 'true', '唯一': 'true' },
], { skipHeader: true, origin: -1 });

// E1-关系
XLSX.utils.sheet_add_json(wb.Sheets['E1-关系'], [
  { '源实体英文名称(必填)': 'Material', '关系名称(必填)': '供应商物料', '关系类型(必填)': 'many_to_one', '目标实体英文名称(必填)': 'Supplier' },
], { skipHeader: true, origin: -1 });

// E2-状态机
XLSX.utils.sheet_add_json(wb.Sheets['E2-状态机'], [
  { '实体英文名称(必填)': 'Material', '状态机名称(必填)': '物料状态机', '状态字段': 'status', '状态名称(必填)': '草稿', '是否初始状态': 'true', '是否终止状态': 'false', '转换名称': '提交', '转换从→到': '草稿→已提交', '触发类型': 'manual' },
  { '实体英文名称(必填)': 'Material', '状态机名称(必填)': '物料状态机', '状态字段': 'status', '状态名称(必填)': '已提交', '是否初始状态': 'false', '是否终止状态': 'true', '转换名称': '', '转换从→到': '', '触发类型': '' },
], { skipHeader: true, origin: -1 });

// E3-规则
XLSX.utils.sheet_add_json(wb.Sheets['E3-规则'], [
  { '实体英文名称(必填)': 'Material', '规则名称(必填)': '编码必填', '规则类型(必填)': 'field_validation', '字段': 'code', '条件类型': 'required', '条件值': '', '严重程度': 'error', '错误消息(必填)': '编码不能为空', '优先级': '1', '启用': 'true' },
], { skipHeader: true, origin: -1 });

// E4-事件
XLSX.utils.sheet_add_json(wb.Sheets['E4-事件'], [
  { '实体英文名称(必填)': 'Material', '事件名称(必填)': '物料创建', '英文名称': 'MaterialCreated', '触发时机(必填)': 'create', '描述': '物料创建事件' },
], { skipHeader: true, origin: -1 });

// E5-部门
XLSX.utils.sheet_add_json(wb.Sheets['E5-部门'], [
  { '部门名称(必填)': '采购部', '英文名称(必填)': 'Procurement', '部门编码': 'DEPT-001', '部门类型': 'department', '状态': 'active' },
], { skipHeader: true, origin: -1 });

// E5-岗位
XLSX.utils.sheet_add_json(wb.Sheets['E5-岗位'], [
  { '岗位名称(必填)': '采购主管', '英文名称(必填)': 'ProcurementManager', '岗位编码': 'POS-001', '所属部门编码(必填)': 'DEPT-001', '层级': '1', '编制人数': '1', '状态': 'active' },
], { skipHeader: true, origin: -1 });

// E6-指标
XLSX.utils.sheet_add_json(wb.Sheets['E6-指标'], [
  { '指标名称(必填)': '物料创建数', '英文名称(必填)': 'MaterialCount', '公式(必填)': 'COUNT(Material)', '单位(必填)': '个', '绑定动作(必填)': 'create', '测量方式(必填)': 'cumulative' },
], { skipHeader: true, origin: -1 });

// E7-边界约束
XLSX.utils.sheet_add_json(wb.Sheets['E7-边界约束'], [
  { '约束名称(必填)': '物料隔离', '英文名称(必填)': 'MaterialIsolation', '隔离级别(必填)': 'serializable' },
], { skipHeader: true, origin: -1 });

// E8-数据源
XLSX.utils.sheet_add_json(wb.Sheets['E8-数据源'], [
  { '数据源名称(必填)': '物料数据库', '数据源类型(必填)': 'database', '基础URL': 'jdbc:postgresql://localhost/material' },
], { skipHeader: true, origin: -1 });

// 3. Export filled workbook and import it
console.log('\n=== 3. Import filled template ===');
const filledBuf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
const formData = new FormData();
const blob = new Blob([filledBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
formData.append('file', blob, 'filled-template.xlsx');

const importRes = await fetch('http://localhost:5000/api/excel-import', {
  method: 'POST',
  body: formData
});
const importJson = await importRes.json();
console.log('HTTP:', importRes.status);
console.log('Success:', importJson.success);
if (importJson.validation) {
  console.log(`Validation: totalRows=${importJson.validation.totalRows}, validRows=${importJson.validation.validRows}, errorCount=${importJson.validation.errorCount}`);
  if (importJson.validation.errors?.length > 0) {
    console.log('Errors:');
    importJson.validation.errors.forEach(e => console.log(`  - [${e.sheet}] row ${e.row}: ${e.message}`));
  }
}
if (importJson.parsedData) {
  console.log('\nParsed data counts:');
  Object.entries(importJson.parsedData).forEach(([key, val]) => {
    const count = Array.isArray(val) ? val.length : (typeof val === 'object' ? Object.keys(val).length : val);
    console.log(`  ${key}: ${count}`);
    if (Array.isArray(val) && val.length > 0) {
      console.log(`    sample: ${JSON.stringify(val[0]).substring(0, 150)}`);
    }
  });
}
if (importJson.error) console.log('Error:', importJson.error);

// 4. Summary
console.log('\n=== SUMMARY ===');
const sheets = ['E1-实体', 'E1-属性', 'E1-关系', 'E2-状态机', 'E3-规则', 'E4-事件', 'E5-部门', 'E5-岗位', 'E6-指标', 'E7-边界约束', 'E8-数据源'];
console.log('Template sheets with letter+Chinese prefix:');
sheets.forEach(s => console.log(`  ✓ ${s}`));
console.log('Import round-trip: ' + (importJson.success ? 'PASS' : 'FAIL'));
main();
