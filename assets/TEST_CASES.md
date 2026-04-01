# Ontology MVP 测试总索引（TDD执行版）

本文档作为测试入口索引，完整测试内容已按层级拆分到 tests 目录。

## 1. 拆分后的目录

```text
tests/
├── unit/
│   └── cases.md
├── integration/
│   └── cases.md
├── e2e/
│   └── cases.md
├── test-file-map.md
└── ci-min-checklist.md
```

## 2. 核心文档导航

1. 单元测试用例：`tests/unit/cases.md`
2. 集成测试用例：`tests/integration/cases.md`
3. 端到端测试用例：`tests/e2e/cases.md`
4. 用例与文件命名映射：`tests/test-file-map.md`
5. 本地/流水线最小门禁：`tests/ci-min-checklist.md`

## 3. 执行顺序（TDD）

1. Red：先实现 `tests/unit/cases.md` 的 P0 用例。
2. Green：补齐 `tests/integration/cases.md` 主链路。
3. Refactor：执行 `tests/e2e/cases.md` 冒烟并收敛重构。
4. 合入前：按 `tests/ci-min-checklist.md` 完成统一门禁。

### 3.1 本轮新增关注点：聚合角色建模

围绕最新确认的建模规则，本轮测试需重点覆盖以下约束：

- 所有实体必须明确标记 `entityRole`：`aggregate_root` 或 `child_entity`
- 当 `entityRole='child_entity'` 时，必须提供 `parentAggregateId`
- 仅 `aggregate_root` 可以配置并发布领域事件

对应测试用例：

- Unit：`UT-NORM-003`、`UT-NORM-004`、`UT-NORM-005`
- Integration：`IT-MODEL-ROLE-001`、`IT-MODEL-ROLE-002`
- E2E：`E2E-ROLE-001`、`E2E-ROLE-002`

## 4. 质量目标

- P0 缺陷为 0。
- 核心场景通过率 >= 95%。
- 导出包 Schema 校验通过率 100%。
- 聚合角色约束误配、漏检为 0。

## 5. 备注

- 原有测试内容已迁移到拆分文档，后续仅在 tests 目录维护，避免同一用例多处漂移。

