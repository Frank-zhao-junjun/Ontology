# US-S11b-U03：EPC 编辑器 AI 对话框 + 文档上传

| Unit ID | US-S11b-U03 | 状态 | 📝 草稿 |
| 所属 US | [US-S11b](../us/US-S11b-doc-epc-generate.md) |
| 文件 | `src/components/ontology/ai-draft-fill-dialog.tsx`（扩展） |

## 1. 目标

扩展 `AiDraftFillDialog`，使其在 EPC 节点模式下支持文档上传 + 触发 `POST /api/generate-module-draft` 生成步骤。

## 2. 范围

### In Scope

- 在已有 `AiDraftFillDialog` 中检测 `moduleKind === 'EPC'` 时，激活 EPC 步骤生成模式
- 文档上传：支持 .txt/.md/.csv/.json，≤50000 字符
- 提交后调用 `POST /api/generate-module-draft`，传入文档文本 + EPC 上下文
- 成功后调用 `applyAiEpcDraft` 写入 store
- 加载状态、错误处理、toast 提示

### Out of Scope

- A/B/C 级语义生成（US-S11）
- 要素库 AI（US-S19）

## 3. 技术设计

```typescript
// 扩展 AiDraftFillDialogProps
export type AiDraftFillDialogProps = {
  // ... 原有 props
  // EPC 模式下需额外传入:
  onApplyEpcDraft?: (epcId: string, steps: EpcStepSuggestion[]) => void;
};

// 提交时:
const response = await fetch('/api/generate-module-draft', {
  method: 'POST',
  body: JSON.stringify({
    moduleKind: 'EPC',
    moduleId,
    project: ...,
    userHint: hint || undefined,
    documentText: docText || undefined,  // 新增：文档内容
  }),
});
const { suggestion } = await response.json();
onApplyEpcDraft?.(moduleId, suggestion.steps);
```

## 4. AC

| # | 验收项 | 验证 |
|---|--------|------|
| AC-1 | EPC 模式下显示文档上传区域 | integration |
| AC-2 | 文档上传后读入内容作为 documentText 提交 | integration |
| AC-3 | 提交后调用 onApplyEpcDraft | integration |
| AC-4 | 无文档时仍可生成（不传 documentText） | integration |
| AC-5 | 加载中显示 spinner，错误显示 toast | integration |
| AC-6 | 非法文件格式提示用户 | unit |

## 5. 测试计划

| 类型 | 文件 | 说明 |
|------|------|------|
| Unit | `tests/unit/ai-draft/epc-dialog.spec.ts` | 3 TC |
| Integration | `tests/integration/ai-draft/epc-dialog.spec.tsx` | 6 TC |

## 6. 依赖

- **前置 Unit**：US-S11b-U02（Store）
- **阻塞 US**：US-S11b-U04

## 7. 六步检查

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | |
| ② PRD AC | [ ] | |
| ③ Testing case | [ ] | |
| ④ Coding | [ ] | |
| ⑤ Unit test | [ ] | |
| ⑥ E2E | [ ] | |
