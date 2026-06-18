# US-S05-U01：upsert 内联要素

| Unit ID | US-S05-U01 | 状态 | 进行中 |
| 所属 US | [US-S05](../us/US-S05-save-epc-pipeline.md) |

## PRD AC
- inlineNew + payload → metaElements upsert；清除 inlineNew/inlinePayload；onDraft(E1–E8)

## 测试（先于 Code）
`tests/unit/upsert-inline.spec.ts`

## 流水线 §7
①②③④⑤ [x] ⑥ E2E N/A [x]
