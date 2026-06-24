# 测试文件命名清单（Case -> Spec）

说明：本清单给出“每个用例对应的测试文件命名”，用于统一仓库命名规范。可按技术栈落在 `*.spec.ts`、`*.test.ts` 或 `*.spec.py`，但文件语义保持一致。

## Unit

| 用例 ID | 建议测试文件 | 说明 |
|---|---|---|
| UT-EXPORT-001 | `export-validation.spec.ts` | 版本号必填 |
| UT-EXPORT-002 | `export-validation.spec.ts` | 实体数量校验 |
| UT-EXPORT-003 | `export-seed-toggle.spec.ts` | includeData=false |
| UT-EXPORT-004 | `export-seed-toggle.spec.ts` | includeData=true |
| UT-EXPORT-005 | `export-manifest.spec.ts` | manifest 字段完整性 |
| UT-EXPORT-006 | `export-manifest.spec.ts` | generatedAt 格式 |
| UT-NORM-001 | `normalizer-entity.spec.ts` | nameEn 稳定性 |
| UT-NORM-002 | `normalizer-relation.spec.ts` | 关系引用完整性 |
| UT-NORM-003 | `normalizer-aggregate-root.spec.ts` | 聚合根筛选 |
| UT-AI-001 | `ai-query-intent.spec.ts` | list 意图识别 |
| UT-AI-002 | `ai-query-intent.spec.ts` | analyze 意图识别 |
| UT-AI-003 | `ai-query-execute.spec.ts` | 异常处理 |
| UT-AI-004 | `ai-query-execute.spec.ts` | 成功结构 |

## Integration

| 用例 ID | 建议测试文件 | 说明 |
|---|---|---|
| IT-API-EXPORT-001 | `api-export.spec.ts` | 导出接口成功 |
| IT-API-EXPORT-002 | `api-export-artifact.spec.ts` | 导出包结构 |
| IT-API-EXPORT-003 | `api-export-schema.spec.ts` | Schema 校验 |
| IT-API-EXPORT-004 | `api-export-toggle.spec.ts` | includeData 开关 |
| IT-RUNTIME-001 | `runtime-load.spec.ts` | 加载配置包 |
| IT-RUNTIME-002 | `runtime-version.spec.ts` | 版本切换 |
| IT-RUNTIME-003 | `runtime-invalid-package.spec.ts` | 无效配置包拦截 |
| IT-AUDIT-001 | `runtime-audit-write.spec.ts` | 写操作留痕 |
| IT-AUDIT-002 | `runtime-audit-read.spec.ts` | 只读查询日志 |

## E2E

| 用例 ID | 建议测试文件 | 说明 |
|---|---|---|
| E2E-PIPELINE-001 | `modeling-export-runtime.e2e.spec.ts` | 从建模到加载 |
| E2E-QUERY-001 | `runtime-query-contract.e2e.spec.ts` | 查询合同列表 |
| E2E-VERSION-001 | `runtime-version-switch.e2e.spec.ts` | 运行时版本切换 |

## 建议目录落位

```text
tests/
├── unit/
│   ├── export-validation.spec.ts
│   ├── export-seed-toggle.spec.ts
│   ├── export-manifest.spec.ts
│   ├── normalizer-entity.spec.ts
│   ├── normalizer-relation.spec.ts
│   ├── normalizer-aggregate-root.spec.ts
│   ├── ai-query-intent.spec.ts
│   └── ai-query-execute.spec.ts
├── integration/
│   ├── api-export.spec.ts
│   ├── api-export-artifact.spec.ts
│   ├── api-export-schema.spec.ts
│   ├── api-export-toggle.spec.ts
│   ├── runtime-load.spec.ts
│   ├── runtime-version.spec.ts
│   ├── runtime-invalid-package.spec.ts
│   ├── runtime-audit-write.spec.ts
│   └── runtime-audit-read.spec.ts
└── e2e/
    ├── modeling-export-runtime.e2e.spec.ts
    ├── runtime-query-contract.e2e.spec.ts
    └── runtime-version-switch.e2e.spec.ts
```
