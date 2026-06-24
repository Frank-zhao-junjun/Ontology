# Testing Team — Subagent 编排

Ontology 项目的 **Subagent 测试团队** 角色定义与 Skill 索引。

## 何时启用

- 新 US / Unit 进入 **步骤 3–6**（Testing case → Coding → Unit test → E2E）
- 多文件、多层测试失败需 **并行排查**
- Phase 收尾需要 **回归证据** 与 Spec 六步勾选

## 角色与 Skill

| 角色 | Skill | 职责 |
|------|-------|------|
| **Test Lead** | [test-lead/SKILL.md](./test-lead/SKILL.md) | 策略、派工、门禁 sign-off |
| **Test Designer** | [test-designer/SKILL.md](./test-designer/SKILL.md) | Unit Spec → Testing Cases（先于 Coding） |
| **Unit & Store Tester** | [unit-store-tester/SKILL.md](./unit-store-tester/SKILL.md) | `tests/unit/` 纯函数 + store |
| **Integration / UI Tester** | [integration-ui-tester/SKILL.md](./integration-ui-tester/SKILL.md) | `tests/integration/` 组件与工作区 |
| **E2E Smoke Tester** | [e2e-smoke-tester/SKILL.md](./e2e-smoke-tester/SKILL.md) | `tests/e2e/` 用户路径 `@smoke` |
| **Domain Rule Tester** | [domain-rule-tester/SKILL.md](./domain-rule-tester/SKILL.md) | VX / W-EPC / 覆盖率 / 推导规则 |

## 依赖 Skill（全员）

- `test-driven-development` — RED-GREEN-REFACTOR
- `verification-before-completion` — 无证据不算完成
- `dispatching-parallel-agents` — Test Lead 并行派工
- `systematic-debugging` — 失败定位

## 标准工作流

```
Test Designer (③) → Dev Coding (④) → [Unit | Integration | Domain 并行] (⑤) → E2E (⑥) → Test Lead sign-off
```

## 派工模板（Test Lead 用 Task 工具）

```
你是 {角色}。阅读 .claude/skills/testing-team/{skill}/SKILL.md 并严格遵循。

Unit: {US-Sxx-Uxx}
Spec: docs/ontology-simplification/units/{spec}.md
范围: {文件路径}
退出标准: {vitest 命令} 全绿 + Spec §6/§7 勾选证据

禁止: 改无关生产代码；skip 测试；无输出声称 pass。
返回: 测试文件路径、运行命令、pass 输出摘要、未覆盖 AC。
```

## 项目测试命令

```bash
pnpm test:unit          # 单元 + store
pnpm test:integration   # 集成
pnpm test:e2e:smoke     # E2E 冒烟
pnpm run ci:check       # 全量门禁
pnpm run test:phase1    # Phase 1 回归 (S03–S05)
pnpm run test:phase1.5  # Phase 1.5 (S14)
pnpm run test:phase2    # Phase 2 (S06–S08)
pnpm run test:phase3    # Phase 3 (S09–S11)
pnpm run test:phase4    # Phase 4 (S12–S13)
pnpm run test:phase:all # 全部 Phase 回归
```

## 进展追踪

- [testing/Progress.md](../../../docs/ontology-simplification/testing/Progress.md) — 看板
- [testing/TODO.md](../../../docs/ontology-simplification/testing/TODO.md) — 任务清单
- [testing/testing-cases/_TEMPLATE.md](../../../docs/ontology-simplification/testing/testing-cases/_TEMPLATE.md) — TC 模板

## 参考

- [UNIT_VALIDATION_CHECKLIST.md](../../../docs/ontology-simplification/UNIT_VALIDATION_CHECKLIST.md)
- [AGENTS.md](../../../AGENTS.md)
