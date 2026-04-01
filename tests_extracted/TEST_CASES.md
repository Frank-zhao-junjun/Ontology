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

## 4. 质量目标

- P0 缺陷为 0。
- 核心场景通过率 >= 95%。
- 导出包 Schema 校验通过率 100%。

## 5. 备注

- 原有测试内容已迁移到拆分文档，后续仅在 tests 目录维护，避免同一用例多处漂移。

