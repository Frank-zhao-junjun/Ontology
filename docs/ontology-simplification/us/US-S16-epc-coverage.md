# US-S16：覆盖率分析 + 仪表盘

| 字段 | 值 |
|------|-----|
| **状态** | ✅ 代码已实现，补 Spec 文档 |
| **Phase** | B（EPC v3.1 简化架构升级） |
| **规则范围** | VM 系列 22 条（VM-D/B/R/E/P/G/M/S/E7） |
| **依赖** | US-S05（EPC usageRefs），US-S08（C 工作区） |
| **对应文档** | 3.4 校验体系 - EPC 覆盖率分析 |
| **架构准据** | [ADR 简化架构](../adr-simplified-ontology-model.md) |

## 目标

为每个业务场景（C 节点）提供按八维要素（E1–E8）的 EPC 覆盖率分析，识别未被 EPC 引用的要素，帮助用户补充缺失的关联。

## Unit 拆分

| Unit | 标题 | 文件范围 | 状态 |
|------|------|----------|:----:|
| U01 | `computeCoverage` 纯函数 | `lib/epc-coverage/index.ts` + `types.ts` | ✅ 代码 + 测试已完成 |
| U02 | Store API | `store/ontology-store.ts` → `getEpcCoverage` | ✅ 代码 + 测试已完成 |
| U03 | 覆盖率面板 UI | `components/ontology/epc-coverage-panel.tsx` | ✅ 代码已完成 |
| U04 | 场景工作台集成 | `components/ontology/scenario-workspace.tsx` | ✅ 代码已完成 |

## 验证

```bash
npx vitest run tests/unit/epc-coverage.spec.ts
npx vitest run tests/unit/epc-coverage-store.spec.ts
```
