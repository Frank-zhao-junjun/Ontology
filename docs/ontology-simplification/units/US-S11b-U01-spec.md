# US-S11b-U01：文档解析 + Prompt for EPC steps

| Unit ID | US-S11b-U01 | 状态 | 📝 草稿 |
| 所属 US | [US-S11b](../us/US-S11b-doc-epc-generate.md) |
| 文件 | `src/lib/ai-draft/epc-doc-prompt.ts` |

## 1. 目标

构建 EPC 文档解析 Prompt，将上传的文档文本转换为 EPC 步骤序列 JSON。

## 2. 范围

### In Scope

- `buildEpcDocPrompt(docText, context)` → 拼接 Prompt 字符串
- Prompt 包含：链上下文（A/B/C 路径）、已确认要素目录、文档原文、输出 JSON schema
- 输出 schema：`{ steps: [{ name, description, elementRef: { elementId, versionPin? } }] }`
- 校验函数 `parseEpcSteps(llmOutput)` → 解析 LLM 返回并校验合法性

### Out of Scope

- API 路由、Store、UI

## 3. 技术设计

```typescript
export function buildEpcDocPrompt(
  docText: string,
  context: {
    chainPath: string;           // "采购管理/供应商准入/资质审核"
    confirmedElements: { id: string; name: string; dimension: string }[];
  }
): string;

export interface ParsedEpcSteps {
  steps: EpcStepSuggestion[];
}

export interface EpcStepSuggestion {
  name: string;
  description: string;
  elementRef?: { elementId: string; versionPin?: string };
}

export function parseEpcSteps(llmOutput: string): ParsedEpcSteps;
```

## 4. AC

| # | 验收项 | 验证 |
|---|--------|------|
| AC-1 | Prompt 包含链路径 + 已确认要素目录 | unit |
| AC-2 | 合法 JSON 输出可正确解析 | unit |
| AC-3 | 非法 JSON 抛出明确错误 | unit |
| AC-4 | elementRef 优先引用已确认要素 | unit |
| AC-5 | 文档为空时返回空 steps 数组 | unit |

## 5. 测试计划

| 类型 | 文件 | 说明 |
|------|------|------|
| Unit | `tests/unit/ai-draft/epc-doc-prompt.spec.ts` | 5 TC |

## 6. 依赖

- **前置 Unit**：无
- **阻塞 US**：US-S11b

## 7. 六步检查

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | 本文件 |
| ② PRD AC | [ ] | |
| ③ Testing case | [ ] | |
| ④ Coding | [ ] | |
| ⑤ Unit test | [ ] | |
| ⑥ E2E | N/A | 纯 lib |
