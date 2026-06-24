# US-S01-U01：ADR 骨架与业务链章节

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S01-U01 |
| **所属 US** | [US-S01](../us/US-S01-adr.md) |
| **状态** | 已完成 |

## 1. 目标

创建 `docs/adr-simplified-ontology-model.md`，含 Context/Decision 框架与 A→B→C→EPC 业务链章节。

## 4. PRD 验收条款

| # | 验收项 | 验证方式 |
|---|--------|----------|
| AC-1 | ADR 文件存在 | 文件路径检查 |
| AC-2 | 含 Context、Decision、业务链 | 文档内容评审 |

## 5. 测试计划（⚠️ Testing case 必须在 Coding 之前定义）

> **TDD 要求**：文档类 Unit 以人工评审为主，Testing case 标记为 N/A（不适用）。

### 验证方式

- **类型**：文档评审（Document Review）
- **方法**：人工检查 ADR 文档结构和内容完整性
- **标准**：符合 ADR 模板，包含所有必需章节

## 7. 流水线检查（严格按顺序执行）

| 步骤 | 完成 | 说明 |
|------|------|------|
| Unit Spec | [x] | 本文件填写完整 |
| PRD 验收条款 | [x] | AC 表可测试 |
| **Testing case** | [x] N/A | **文档类 Unit，以人工评审为主** |
| Coding | [x] | 编写 ADR 文档 |
| Unit test 绿灯 | [x] N/A | 无代码，无需单元测试 |
| E2E（若适用） | [x] N/A | 无 UI/流程 |

## 完成证据 — 2026-06-18

- **产出**: [docs/adr-simplified-ontology-model.md](../../adr-simplified-ontology-model.md)
- **说明**: US-S01-U02~U04 同文件一并交付（合并为一个 ADR 文档）
- **流水线**: 文档 AC 全绿；Coding/Unit/E2E 标记为 N/A（合理）
- **验证方式**: 人工评审 ADR 文档结构和内容

### TDD 原则遵循

- ✅ Testing case 在 Spec 中明确定义为 N/A（文档类 Unit）
- ✅ 验收条款清晰可验证
- ✅ 文档质量通过人工评审确认
