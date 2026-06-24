# US-S19-U04：insert 模式验证 + 去重逻辑 + E2E

| Unit ID | US-S19-U04 | 状态 | 📝 草稿 |
| 所属 US | [US-S19](../us/US-S19-doc-element-draft.md) |
| 文件 | 要素库 + Store 端到端 |

## 1. 目标

端到端验证 insert 模式、去重逻辑、UI 刷新在完整流程中的正确执行。

## 2. 范围

### In Scope

- E2E 测试：上传文档 → AI 生成要素 → insert 到要素库 → 列表刷新
- E2E 测试：重复要素插入被跳过
- E2E 测试：insert 后已有要素不变
- E2E 测试：insert 的要素为 draft，不自动 confirm
- 手动 QA：要素库打开 → AI 解析文档 → 上传 → 确认要素出现

### Out of Scope

- 纯函数/Store/UI 组件级别测试（已由 U01~U03 覆盖）

## 3. 技术设计

E2E 测试路径：
```
1. 创建项目，预设 3 个要素（E1 1个，E2 1个，E3 1个）
2. AI 解析文档（文档中包含"客户"、"订单"、"供应商"等实体）
3. 验证"客户"要素被 insert 到 E1
4. 验证已有要素不变（3 个原要素 + 新要素）
5. 再次上传同一文档 → 验证"客户"因重复被跳过
6. 验证 insert 要素均为 draft（status === 'draft'）
7. 验证 confirm 后版本号递增
```

## 4. AC

| # | 验收项 | 验证 |
|---|--------|------|
| AC-1 | AI 生成后要素库显示新要素 | E2E |
| AC-2 | 已有要素不受影响 | E2E |
| AC-3 | 重复插入被跳过 | E2E |
| AC-4 | 新要素均为 draft | E2E |
| AC-5 | lint/ts-check 0 error | CI |

## 5. 测试计划

| 类型 | 文件 | 说明 |
|------|------|------|
| E2E | `tests/e2e/ai-draft/element-insert.spec.ts` | 5 TC |

## 6. 依赖

- **前置 Unit**：US-S19-U01, U02, U03
- **阻塞 US**：无

## 7. 六步检查

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | |
| ② PRD AC | [ ] | |
| ③ Testing case | [ ] | |
| ④ Coding | [ ] | |
| ⑤ Unit test | [ ] | |
| ⑥ E2E | [ ] | |
