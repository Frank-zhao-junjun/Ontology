# 测试说明

## Manifest 对齐（P0）

| 套件 | 文件 | 说明 |
|------|------|------|
| Validator V01–V11 | `unit/manifest-validator.spec.ts` | Golden：`fixtures/manufacturing-manifest.yaml` |
| Compiler | `unit/manifest-compiler.spec.ts` | `fixtures/manifest-compile-project.json` |
| **P0-12 制造域 golden** | `unit/manifest-manufacturing-golden.spec.ts` | compile → validate → export；id/nameEn 与 golden 子集对齐 |
| 前端导出 | `unit/manifest-export.spec.ts` | `buildManifestExportBundle` |

## Skill 导出（新增）

| 套件 | 文件 | 说明 |
|------|------|------|
| annotate-status | `unit/skill-export-annotate-status.spec.ts` | resolveProjectStatus, annotateObjectStatus |
| build-ontology-json | `unit/skill-export-build-ontology-json.spec.ts` | buildOntologyJson, isEmptyScope, scope 过滤 |
| build-skill-json | `unit/skill-export-build-skill-json.spec.ts` | buildSkillJson 元数据生成 |
| build-intents-json | `unit/skill-export-build-intents-json.spec.ts` | entity/relation/rule/stateMachine intents |
| Route | `unit/export-skill-route.spec.ts` | POST /api/export/skill 接口测试 |

### 运行

```bash
pnpm exec vitest run tests/unit/manifest-manufacturing-golden.spec.ts
pnpm exec vitest run tests/unit/manifest-validator.spec.ts tests/unit/manifest-compiler.spec.ts tests/unit/manifest-export.spec.ts tests/unit/manifest-manufacturing-golden.spec.ts
pnpm exec vitest run tests/unit/skill-export-*
pnpm exec vitest run tests/unit/export-skill-route.spec.ts
```

### P0-12 期望文件

- `fixtures/manufacturing-manifest.yaml` — 平台参考样例（完整制造域）
- `fixtures/manifest-compile-project.json` — 设计台最小制造项目
- `fixtures/manufacturing-golden-expectations.json` — 编译输出必须覆盖的 **id / nameEn 子集**（非整文件 snapshot）

属性命名采用**方案 A**：`properties[].nameEn` = 平台表列（snake_case）；`properties[].id` = Manifest 内稳定键。
