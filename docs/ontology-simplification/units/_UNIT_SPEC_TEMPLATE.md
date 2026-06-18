# Unit Spec 模板

> 复制本文件为 `{US-id}-U{n}-spec.md`，填写后进入自动流水线。  
> 原则：**Unit 越小越好** — 单一职责、少量文件、可独立验收。
> 
> ⚠️ **TDD 原则**：**Testing case 必须在 Coding 之前完成**！先写测试用例，再实现代码。

---

# {US-Sxx-U0n}：{简短标题}

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-Sxx-U0n |
| **所属 US** | [US-Sxx](../us/US-Sxx-xxx.md) |
| **状态** | 草稿 / 进行中 / 已完成 |
| **负责人** | （可选） |
| **预估文件** | （列出将改动的路径，≤5 个为宜） |

## 1. 目标（一句话）

<!-- 本 Unit 交付什么 -->

## 2. 范围

### In Scope

-

### Out of Scope

-

## 3. 技术设计（简要）

<!-- 接口、类型、函数签名、UI 行为等 -->

## 4. PRD 验收条款

| # | 验收项 | 验证方式 |
|---|--------|----------|
| AC-1 | | 单元测试 / 手动 / 文档评审 |
| AC-2 | | |

## 5. 测试计划（⚠️ 必须在 Coding 之前完成）

> **TDD 要求**：先编写测试用例骨架，确保覆盖所有 AC，然后再开始编码实现。

| 类型 | 文件路径 | 说明 |
|------|----------|------|
| Unit test | `repo-main/tests/unit/...` | **必须先创建测试文件骨架** |
| Integration | `repo-main/tests/integration/...` | 可选 |
| E2E | `repo-main/tests/e2e/...` | 仅 UI/流程 Unit 需要 |

## 6. 依赖

- **前置 Unit**：
- **阻塞 US**：

## 7. 流水线检查（六步强制 — 全部 `[x]` 才可标「已完成」）

> 顺序：①→②→③→④→⑤→⑥。**③ 必须先于 ④**。详见 [`UNIT_VALIDATION_CHECKLIST.md`](../UNIT_VALIDATION_CHECKLIST.md)

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [ ] | 本文件填写完整 |
| ② PRD 验收条款 | [ ] | AC 表可测试 |
| ③ **Testing case** | [ ] | **必须先于 ④** |
| ④ Coding | [ ] | 实现代码 |
| ⑤ Unit test 绿灯 | [ ] | 所有测试通过 |
| ⑥ E2E | [ ] | UI/流程测试；纯 lib 写 `N/A` |

## 8. 完成证据

<!-- PR 链接、命令输出摘要、截图路径 -->

```bash
cd repo-main
pnpm lint
pnpm ts-check
pnpm test:unit -- <相关 spec 路径>
```
