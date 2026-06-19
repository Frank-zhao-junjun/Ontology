# US-SXX: Testing Cases — {US 标题}

> 日期: YYYY-MM-DD  
> 对应 Spec: [US-SXX-U0Y-spec.md](../units/US-SXX-U0Y-spec.md)  
> 对应 US: [US-SXX](../us/US-SXX-*.md)  
> 测试文件: `tests/unit/...` · `tests/integration/...` · `tests/e2e/...`

---

## 使用说明

- 每个 TC 使用 **Given / When / Then** 格式，先于 Coding 合入（六步 ③）
- `实现状态`：`✅ 已实现` · `🟡 待实现` · `— N/A`
- 实现后在 Spec §7 步骤 3 勾选，并更新 [Progress.md](../Progress.md)

---

## US-SXX-U01：{Unit 标题}

### TC-U01-01: {场景简述}

**Given**:
- ...

**When**: `{函数/API}(...)`

**Then**:
- ...

**实现状态**: 🟡  
**测试映射**: `tests/unit/xxx.spec.ts` → `it('...')`

---

## US-SXX-U02：{Unit 标题}

### TC-U02-01: {场景简述}

**Given**:
- ...

**When**: ...

**Then**:
- ...

**实现状态**: 🟡  
**测试映射**: ...

---

## 汇总

| TC ID | Unit | 场景 | 关键断言 | 状态 |
|-------|------|------|----------|------|
| TC-U01-01 | U01 | ... | ... | 🟡 |
| TC-U02-01 | U02 | ... | ... | 🟡 |

---

## 回归命令

```bash
pnpm run test:phaseN   # 替换 N 为对应 Phase
```
