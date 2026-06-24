# US-S13：compiler 迁移 + golden

| 字段 | 值 |
|------|-----|
| **ID** | US-S13 |
| **Phase** | 4 |
| **优先级** | P3 |
| **状态** | ✅ 已完成（2026-06-18） |
| **依赖** | US-S12 |
| **主计划** | [本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |

## User Story

**作为** 平台集成人员，  
**我希望** manifest-compiler 输出简化架构 A/B/C/EPC 与已确认要素快照，且 P0-12 golden 不退化，  
**以便** 设计台导出与 ontology-platform 契约对齐。

## 范围（In Scope）

| 项 | 说明 |
|----|------|
| `compileSimplifiedChain` | 从 `valueDomains/capabilities/scenarios/epcProcesses` + confirmed 快照编译 |
| `metadata.extensions.simplifiedChain` | 扩展段写入 Manifest（validator 允许额外字段） |
| EPC 警示 | extensions 含 `epcWarnings` 摘要（W-EPC，不阻断 valid） |
| Golden | 扩展 fixture；P0-12 仍 `valid: true` |

## 范围外

| 项 | 说明 |
|----|------|
| 修改 ontology-manifest-spec 正式 schema | 仅用 extensions 扩展 |
| 删除 legacy semantic 映射 | 双写保留 |

## 验收标准

| # | 标准 | 验证 |
|---|------|------|
| AC-1 | 含业务链 fixture compile 后 extensions.simplifiedChain 非空 | unit |
| AC-2 | manufacturing golden compile + validate 仍零 error | unit |
| AC-3 | extensions 含 epcWarnings 数组（可为空） | unit |
| AC-4 | CI 全绿 | ci:check |

## Unit 拆分

| Unit | 标题 | ⑥ E2E |
|------|------|-------|
| U01 | `compileSimplifiedChain` 纯函数 | N/A |
| U02 | 挂接 `compileMetadata` extensions | N/A |
| U03 | golden + 业务链 fixture 测试 | N/A |
| U04 | manifest-export 端到端回归 | N/A |

## 确认

- [x] Frank，2026-06-18
