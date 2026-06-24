# US-S18-U02：Store API + C 工作区按钮

| Unit ID | US-S18-U02 | 状态 | ✅ 已完成 |
| 所属 US | [US-S18](../us/US-S18-epc-derivation.md) |
| 文件 | `src/store/ontology-store.ts`, `src/components/ontology/scenario-workspace.tsx` |

## 1. 目标

在 store 暴露推导相关 API，在 C 工作区实现「从模型推导」按钮，一键生成 draft EPC 步骤。

## 2. 测试

**测试文件**：`tests/unit/epc-derivation-store.spec.ts`, `tests/e2e/epc-derivation.e2e.spec.ts`

| # | 名称 | 说明 |
|---|------|------|
| TC-01 | store 暴露 `deriveEpcSteps` API | 调用后返回推导步骤列表 |
| TC-02 | store 暴露 `applyDerivedSteps` | 将推导步骤应用到 EPC draft |
| TC-03 | 按钮渲染 | C 工作区显示「从模型推导」按钮 |
| TC-04 | 点击按钮触发推导 | 推导结果展示在预览区域 |
| TC-05 | 应用推导步骤到 EPC | 确认后步骤写入 EPC |

**验证**：`npx vitest run tests/unit/epc-derivation-store.spec.ts` — 5/5 pass · E2E smoke pass

## 6. 六步验证

①②③ [x] ④⑤ [x] ⑥ E2E [x] smoke pass
