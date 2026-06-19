# US-S18-U04：ElementCoverageBadge — EPC 覆盖状态徽章

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S18-U04 |
| **所属 US** | [US-S18](../us/US-S18-epc-derivation.md) |
| **状态** | ✅ 已完成 — 六步闭环 |
| **预估文件** | `src/components/ontology/element-coverage-badge.tsx` |

## 1. 目标

为各八维编辑器提供 `ElementCoverageBadge` 组件，显示单个 MetaElement 是否被 EPC 引用，帮助用户识别「游离要素」。

## 2. 范围

### In Scope

- `ElementCoverageBadge` 组件（Props: `element: MetaElement`）
- 两种状态：「已覆盖」（绿色 Badge + `data-covered="true"`）/「未覆盖」（灰色 Badge + `data-covered="false"`）
- 通过 Store 的 `getElementUsageRefs` 判断引用状态

### Out of Scope

- 编辑器内部集成（各编辑器自行引入）

## 3. 技术设计

### Props

```typescript
export interface ElementCoverageBadgeProps {
  element: MetaElement;
}
```

### 判断逻辑

```typescript
const usageRefs = useOntologyStore((s) => s.getElementUsageRefs(element.id));
const isCovered = usageRefs.length > 0;
```

### 渲染

```
已覆盖 → Badge variant="default" (绿) · text="已覆盖" · data-covered="true"
未覆盖 → Badge variant="outline" (灰) · text="未覆盖" · data-covered="false"
```

## 4. PRD 验收条款

| # | 验收项 | 验证方式 | 对应 TC |
|---|--------|----------|:--:|
| AC-1 | 未被引用时显示「未覆盖」+ data-covered=false | 集成测试 | TC-01 |
| AC-2 | 被已确认 EPC 引用时显示「已覆盖」+ data-covered=true | 集成测试 | TC-02 |

## 5. 测试用例

| # | 场景 | 条件 | 预期 |
|---|------|------|------|
| TC-01 | 未引用要素 | MetaElement 无 usageRefs | text "未覆盖" · data-covered="false" |
| TC-02 | 已引用要素 | MetaElement 有 usageRefs 指向已确认 EPC | text "已覆盖" · data-covered="true" |

## 6. 六步验证

- [x] ① Unit Spec（本文档）
- [x] ② PRD（§4 验收条款 — 2 项 AC 全部通过）
- [x] ③ Testing case（§5 — 2 cases，先于编码）
- [x] ④ Coding（`element-coverage-badge.tsx` ~30 LOC）
- [x] ⑤ Unit test（`tests/integration/element-coverage-badge.spec.tsx` 2/2 全绿）
- [x] ⑥ E2E（N/A，纯 Badge 组件，集成测试已覆盖交互）

## 7. 验证命令

```bash
cd D:\AI\Ontology
npx vitest run tests/integration/element-coverage-badge.spec.tsx --reporter=verbose
# 2/2 pass ✅
```
