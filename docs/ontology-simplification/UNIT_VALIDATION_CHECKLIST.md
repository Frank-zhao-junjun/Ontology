# Unit 验证检查清单

每个 Unit **必须六步全部勾选** 才算完成；**任一步未勾选不得标记 Unit 为「已完成」**。

**仅 US 需要用户确认**；Unit 内按本清单**严格顺序**自动执行。

⚠️ **TDD 强制**：步骤 3（Testing case）**必须先于**步骤 4（Coding）合入/完成。未先有用例骨架 → 不得开始编码。

主计划：[docs/本体建模简化架构.plan.md](../本体建模简化架构.plan.md)

---

## 门禁规则（2026-06-18 起强制执行）

1. **顺序不可跳步**：1 → 2 → 3 → 4 → 5 → 6  
2. **Step 3 先于 Step 4**：测试文件须先存在（可先 failing）  
3. **Step 6**：纯 lib/文档 Unit 须在 Spec 写明 `E2E: N/A` 并勾选  
4. **Unit Spec §7 六行全部 `[x]`** + 完成证据命令输出  
5. **US 下所有 Unit 六步闭环后**，US 才可标「已完成」

---

## 流水线步骤（严格按顺序执行）

| # | 步骤 | 检查项 | 命令 / 方式 | 通过 |
|---|------|--------|-------------|------|
| 1 | **Unit Spec** | 已创建 `units/{US-id}-U{n}-spec.md` | 文件存在；范围/非目标/依赖完整 | [ ] |
| 2 | **PRD** | Spec 内 AC 表可测试、与主计划无冲突 | 人工或 Agent 对照主计划决策表 | [ ] |
| 3 | **Testing case** ⚠️ | 用例文件或清单已就绪 | `tests/unit|integration|e2e` 路径明确 | [ ] |
| 4 | **Coding** | 实现完成且无无关改动 | 见下方「代码质量」 | [ ] |
| 5 | **Unit test** | 本 Unit 相关用例 100% pass | `pnpm test:unit`（可 scoped） | [ ] |
| 6 | **E2E** | 本 Unit 涉及 UI/流程时已跑 | 见下方「E2E 策略」 | [ ] |

> ⚠️ **重要**：步骤 3（Testing case）必须在步骤 4（Coding）之前完成并勾选。这是 TDD（测试驱动开发）的核心要求。

---

## 代码质量（步骤 4，在 `repo-main/` 执行）

```bash
cd repo-main
pnpm lint          # 必须 0 error
pnpm ts-check      # 必须 0 error
```

| 检查项 | 通过 |
|--------|------|
| ESLint 0 error | [ ] |
| TypeScript 0 error | [ ] |
| 仅改动 Unit Spec 列出的文件（或合理扩展） | [ ] |
| 无未使用 import / 死代码（本 Unit 引入的） | [ ] |

---

## 单元测试（步骤 5）

```bash
cd repo-main
pnpm test:unit
# 或仅跑本 Unit：
pnpm test:unit -- tests/unit/<your-spec>.spec.ts
```

| 检查项 | 通过 |
|--------|------|
| 本 Unit 新增/修改的 spec 全部 pass | [ ] |
| 未破坏既有 `tests/unit` 用例 | [ ] |
| 验收条款 AC 均有测试或文档证据映射 | [ ] |

---

## 集成测试（可选，UI/API Unit）

```bash
cd repo-main
pnpm test:integration
```

| 检查项 | 通过 |
|--------|------|
| 本 Unit 相关 integration spec pass（若适用） | [ ] |

---

## E2E 策略（步骤 6）

| Unit 类型 | 要求 |
|-----------|------|
| 纯类型 / 纯文档 / 纯 lib | **跳过 E2E**，在 Spec 中注明 `E2E: N/A` |
| Store / API | 优先 unit + integration；E2E 可选 |
| UI 组件 / 工作台导航 | 至少 smoke 或 scoped e2e |

```bash
cd repo-main
pnpm test:e2e:smoke
# 或 scoped：
pnpm test:e2e:smoke -- <grep 模式>
```

| 检查项 | 通过 |
|--------|------|
| E2E 已执行或 Spec 标明 N/A | [ ] |
| Smoke 通过（若执行） | [ ] |

---

## 发布前全量门禁（多 Unit 合并 / 发版前）

```bash
cd repo-main
pnpm run ci:check
```

包含：`lint` + `ts-check` + `test:unit` + `test:integration` + `test:e2e:smoke`

| 检查项 | 通过 |
|--------|------|
| `ci:check` 全绿 | [ ] |

---

## 文档类 Unit（US-S01 等）

无 `repo-main` 代码时，步骤 4–6 替换为：

| 检查项 | 通过 |
|--------|------|
| 文档路径正确（`docs/` 下） | [ ] |
| 链接可解析、与主计划一致 | [ ] |
| Spec 中所有 AC 已勾选 | [ ] |
| （可选）`pnpm ts-check` 若只改 markdown 则 N/A | [ ] |

---

## Unit 完成记录模板

```markdown
## US-Sxx-U0n 完成 — YYYY-MM-DD

- Spec: docs/ontology-simplification/units/US-Sxx-U0n-spec.md
- 证据: lint ✓ ts-check ✓ unit ✓ e2e N/A
- 备注: ...
```

将完成记录追加到对应 Unit Spec 底部或 `docs/progress.md`。
