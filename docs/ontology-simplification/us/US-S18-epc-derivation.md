# US-S18：EPC 推导 + UI 增强

| 字段 | 值 |
|------|-----|
| **状态** | ✅ 代码、测试、UI 全部完成，补 Spec 文档 |
| **Phase** | D（EPC v3.1 简化架构升级） |
| **依赖** | US-S17（交叉一致性 VX），US-S16（覆盖率数据） |
| **架构准据** | [ADR 简化架构](../adr-simplified-ontology-model.md) |

## 目标

从已确认的 E1–E8 要素和 A/B/C.semantics 自动推导 EPC 步骤骨架，在各编辑器显示覆盖率 Badge。

## Unit 拆分

| Unit | 标题 | 文件范围 | 测试 | 状态 |
|------|------|----------|------|:----:|
| U01 | `deriveEpcSteps` 纯函数 | `lib/epc-derivation/index.ts` | 12 条 | ✅ |
| U02 | Store API + C 工作区按钮 | `store/ontology-store.ts` + `scenario-workspace.tsx` | 5 条 | ✅ |
| U03 | 覆盖率 Badge 组件 | `components/ontology/element-coverage-badge.tsx` | 2 条 | ✅ |

## 推导算法

1. E3 事件 → 首/尾 bookend 步骤
2. E1 数据 → info 步骤
3. E2 行为 → function 步骤
4. E7 约束 → decision/compensation 步骤
5. E5 角色 → org unit 步骤

输出顺序：`E3(起始) → E1* → E2* → E7* → E5* → E3(结束)`

## 验证

```bash
npx vitest run tests/unit/epc-derivation*.spec.ts tests/integration/element-coverage-badge.spec.tsx tests/e2e/epc-derivation.e2e.spec.ts
# 19/19 pass
```
