# US-S11b-U04：fork 规则集成 + E2E

| Unit ID | US-S11b-U04 | 状态 | 📝 草稿 |
| 所属 US | [US-S11b](../us/US-S11b-doc-epc-generate.md) |
| 文件 | EPC 编辑流程端到端 |

## 1. 目标

验证 fork 规则在完整 EPC 编辑流程中的正确执行。

## 2. 范围

### In Scope

- E2E 测试：三种 fork 场景（有确认版、有 draft、无两者）
- E2E 测试：文档上传 → AI 生成 → 步骤刷新 → 不 confirm
- 手动 QA：打开 EPC 编辑器 → 点击 AI 填充 → 上传文档 → 确认步骤生成

### Out of Scope

- 纯函数/Store/UI 组件级别测试（已由 U01~U03 覆盖）

## 3. 技术设计

E2E 测试路径：
```
1. 创建 A→B→C→EPC
2. 确认 EPC（产生 v1）
3. 调用 AI 填充 → 验证 fork 出新 draft，v1 不变
4. 删除确认版 → 创建 draft → AI 填充 → 验证覆盖
5. 删除所有 → AI 填充 → 验证创建
```

## 4. AC

| # | 验收项 | 验证 |
|---|--------|------|
| AC-1 | 有确认版时 fork 后原确认版不受影响 | E2E |
| AC-2 | 只有 draft 时覆盖成功 | E2E |
| AC-3 | 无任何版本时创建新 draft | E2E |
| AC-4 | AI 生成后步骤列表刷新显示新内容 | E2E |
| AC-5 | lint/ts-check 0 error | CI |

## 5. 测试计划

| 类型 | 文件 | 说明 |
|------|------|------|
| E2E | `tests/e2e/ai-draft/fork-rules.epc.spec.ts` | 5 TC |

## 6. 依赖

- **前置 Unit**：US-S11b-U01, U02, U03
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
