# US-S14-U01：确认流纯函数

| Unit ID | US-S14-U01 | 状态 | 已完成 |
| 所属 US | [US-S14](../us/US-S14-module-confirm-archive-ui.md) |

## PRD AC
- AC-3：validateConfirm + runConfirmFlow；确认 v(N+1)，旧 confirmed → archived
- AC-4：无 draft / name 空 → errors[]

## 测试（先于 Code）
`tests/unit/confirm-flow.spec.ts`

## 流水线 §7
①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
