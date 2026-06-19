# US-S08-U01：引用并集纯函数

| Unit ID | US-S08-U01 | 状态 | 已完成 |
| 所属 US | [US-S08](../us/US-S08-c-workspace.md) |

## 测试（先于 Code）

**测试文件**：`tests/unit/scenario-workspace.spec.ts`

| # | 名称 | 说明 |
|---|------|------|
| TC-1 | 列出 C 下子 EPC | `getChildEpcProcesses('c1')` 返回属于该 C 的所有 EPC |
| TC-2 | 构建引用并集 | `buildScenarioReferenceUnion` 按 elementId 聚合引用，包含来源列表 |
| TC-3 | 跳过无 elementRef 的步骤 | 无 elementRef 的步骤不进入并集计数 |

## 流水线 §7
①②③ [x] ④⑤ [x] ⑥ E2E N/A [x]
