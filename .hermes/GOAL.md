# GOAL — 项目一收尾：覆盖率 80% + ci:check 全绿

## 最终目标

项目一 (D:\AI\Ontology) 在**不改动业务逻辑**的前提下，将覆盖率从当前基线提升至 **≥80%**，并通过 `ci:check`（lint + ts-check + unit + integration + e2e:smoke + phase4）全绿验收，commit + push。

## 交付物

| # | 交付物 | 说明 |
|---|--------|------|
| 1 | 新增测试文件 | 覆盖 store/validation/components/hooks/API 中未覆盖的关键路径 |
| 2 | `vitest.config.ts` / 相关配置 | 如需调整覆盖范围或 ci 脚本 |
| 3 | `ci:check` 全绿通过 | lint 0 error / ts-check pass / 987+ tests / integration / e2e smoke / phase4 全部通过 |
| 4 | git commit + push | 单次或分批提交，最终 push 到 remote/main |

## 完成标准

- [ ] `pnpm run lint` — exit 0（允许 warnings）
- [ ] `pnpm run ts-check` — exit 0
- [ ] `pnpm run test:unit` — 全部通过
- [ ] `pnpm run test:integration` — 全部通过
- [ ] `pnpm run test:e2e:smoke` — 全部通过
- [ ] `pnpm run test:phase4` — 全部通过
- [ ] `npx vitest run --coverage` — **总覆盖率 ≥80%**（statements/branches/functions/lines 任一达标）
- [ ] git commit + push 到 remote

## 允许修改范围

- 新增 `.spec.ts` / `.spec.tsx` 测试文件
- 修改 `vitest.config.ts` 覆盖率配置（include/exclude/reporter）
- 从源代码中提取纯函数到独立文件（不改业务逻辑，只重构可测试性）
- 修改 `ci:check` 脚本（如需调整 task order）
- 添加测试 helper / fixture / mock 文件
- 修改 `.gitignore` 排除覆盖率报告

## 禁止事项

- **不得修改业务逻辑源代码的行为**（validate、store mutation、component behavior）
- 不得删除已存在的测试（除非被重构吸收）
- 不得引入新的外部依赖

## 验收方式

最终由 `ci:check` 命令全绿通过为准。执行命令：

```bash
cd /d/AI/Ontology && pnpm run ci:check && git add -A && git commit -m "..." && git push
```
