# US-S19-U01：文档解析 + Prompt for E1~E8

| Unit ID | US-S19-U01 | 状态 | 📝 草稿 |
| 所属 US | [US-S19](../us/US-S19-doc-element-draft.md) |
| 文件 | `src/lib/ai-draft/element-doc-prompt.ts` |

## 1. 目标

构建 E1~E8 要素文档解析 Prompt，将上传的文档文本转换为八维要素 JSON 数组，用于增量 insert 到要素库 draft。

## 2. 范围

### In Scope

- `buildElementDocPrompt(docText, context)` → 拼接 Prompt 字符串
- Prompt 包含：当前项目领域、已存在的要素列表（用于去重判断）、文档原文、E1~E8 各维度 JSON schema
- 输出 schema：`{ elements: [{ name, nameEn?, description, dimension (E1~E8), fields }] }`
- 校验函数 `parseElementDrafts(llmOutput)` → 解析 LLM 返回并校验合法性
- 去重提示注入：Prompt 中告知 LLM 已有要素名称，避免生成重复

### Out of Scope

- Store、API 路由、UI

## 3. 技术设计

```typescript
export function buildElementDocPrompt(
  docText: string,
  context: {
    domain: string;
    existingElementNames: { dimension: string; name: string }[];
  }
): string;

export interface ParsedElementDrafts {
  elements: ElementDraftSuggestion[];
}

export interface ElementDraftSuggestion {
  name: string;
  nameEn?: string;
  description: string;
  dimension: 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8';
  fields: Record<string, any>;  // 维度特定字段
}

export function parseElementDrafts(llmOutput: string): ParsedElementDrafts;
```

## 4. AC

| # | 验收项 | 验证 |
|---|--------|------|
| AC-1 | Prompt 包含领域 + 已有要素名称列表 | unit |
| AC-2 | 合法 JSON 可正确解析为按维度分组的要素数组 | unit |
| AC-3 | 非法 JSON 抛出明确错误 | unit |
| AC-4 | 重复名称（与已有要素同名同维度）被 LLM 排除 | unit |
| AC-5 | 文档为空时返回空 elements 数组 | unit |

## 5. 测试计划

| 类型 | 文件 | 说明 |
|------|------|------|
| Unit | `tests/unit/ai-draft/element-doc-prompt.spec.ts` | 5 TC |

## 6. 依赖

- **前置 Unit**：无
- **阻塞 US**：US-S19

## 7. 六步检查

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | |
| ② PRD AC | [ ] | |
| ③ Testing case | [ ] | |
| ④ Coding | [ ] | |
| ⑤ Unit test | [ ] | |
| ⑥ E2E | N/A | 纯 lib |
