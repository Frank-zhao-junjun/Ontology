import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { utils, write } from 'xlsx';
import { POST } from '@/app/api/excel-import/route';

function sheet(rows: unknown[][]) {
  return utils.aoa_to_sheet(rows);
}

function buildWorkbookFile(): File {
  const wb = utils.book_new();

  utils.book_append_sheet(wb, sheet([
    ['实体名称(必填)', '英文名称(必填)', '实体角色', '父聚合ID', '项目名称', '业务场景', '描述', '业务含义', '同义词(逗号分隔)'],
    ['订单', 'Order', 'aggregate_root', '', '销售', '下单', '', '', ''],
  ]), '实体');
  utils.book_append_sheet(wb, sheet([['实体英文名称(必填)', '属性名称(必填)', '英文名称(必填)', '数据类型(必填)', '必填', '唯一']]), '属性');
  utils.book_append_sheet(wb, sheet([['源实体英文名称(必填)', '关系名称(必填)', '关系类型(必填)', '目标实体英文名称(必填)']]), '关系');
  utils.book_append_sheet(wb, sheet([['实体英文名称(必填)', '状态机名称(必填)', '状态字段', '状态名称(必填)']]), '状态机');
  utils.book_append_sheet(wb, sheet([['实体英文名称(必填)', '规则名称(必填)', '规则类型(必填)', '字段', '条件类型', '条件值', '严重程度', '错误消息(必填)']]), '规则');
  utils.book_append_sheet(wb, sheet([
    ['实体英文名称(必填)', '事件名称(必填)', '英文名称', '触发时机(必填)', '条件', '事务阶段', '领域事件', '载荷字段(逗号分隔)', '描述'],
    ['Order', '订单已创建', 'OrderCreated', 'create', '', 'AFTER_COMMIT', 'true', 'id,code', ''],
  ]), '事件');

  const buffer = write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([buffer], 'ontology-import.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('Excel import route', () => {
  it('returns parsed events using the store importer contract', async () => {
    const formData = new FormData();
    formData.append('file', buildWorkbookFile());
    const request = new NextRequest('http://localhost/api/excel-import', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.parsedData.events).toEqual([
      expect.objectContaining({
        entityNameEn: 'Order',
        name: '订单已创建',
        nameEn: 'OrderCreated',
        trigger: 'create',
        payloadFields: ['id', 'code'],
      }),
    ]);
    expect(payload.parsedData.eventDefinitions).toBeUndefined();
  });
});
