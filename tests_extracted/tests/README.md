# Ontology MVP 测试目录（TDD）

本目录将原 `TEST_CASES.md` 按测试层级拆分为可直接执行的结构。

## 目录结构

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

## 使用方式

1. 先按 `unit/cases.md` 建立单元测试，遵循 Red -> Green -> Refactor。
2. 再按 `integration/cases.md` 串联导出、加载、版本切换链路。
3. 最后按 `e2e/cases.md` 验证业务闭环。
4. 用 `test-file-map.md` 统一测试文件命名，避免团队各自命名。
5. 用 `ci-min-checklist.md` 对齐本地与流水线门禁。

## 质量目标

- P0 缺陷为 0。
- 核心场景通过率 >= 95%。
- 导出包 Schema 校验通过率 100%。
