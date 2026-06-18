# US-S04-U01：业务链树纯函数库

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S04-U01 |
| **所属 US** | [US-S04](../us/US-S04-business-chain-tree.md) |
| **状态** | 已完成（六步闭环） |
| **预估文件** | `repo-main/src/lib/business-chain/tree.ts`、`repo-main/tests/unit/business-chain-tree.spec.ts` |

## 1. 目标

提供 A→B→C→EPC 树构建、路径展示、节点查找与删除校验的纯函数库。

## 2. 范围

### In Scope

- `buildBusinessChainTree`、`getBusinessChainDisplayPath`、`findBusinessChainNode`、`canDeleteBusinessChainNode`
- 非法 `parentId` 节点不参与树构建

### Out of Scope

- Store / UI / E2E

## 3. 技术设计

`BusinessChainNodeKind = 'A'|'B'|'C'|'EPC'`；树节点含 `kind,id,name,children`。

## 4. PRD 验收条款

| # | 验收项 | 验证方式 | AC 映射 |
|---|--------|----------|---------|
| AC-1 | 四级严格父子树 | unit | US-S04 #2 |
| AC-2 | 显示路径为 name 链 | unit | US-S04 #3 |
| AC-3 | 有子节点不可删 A/B/C；空 C、EPC 可删 | unit | US-S04 #6 |
| AC-4 | 孤儿节点过滤 | unit | US-S04 #2 |

## 5. 测试计划（先于 Coding）

| 类型 | 文件路径 |
|------|----------|
| Unit test | `repo-main/tests/unit/business-chain-tree.spec.ts` |

## 6. 依赖

- **前置 Unit**：US-S02、US-S03
- **阻塞 US**：US-S04-U02

## 7. 流水线检查（六步强制）

| 步骤 | 完成 | 证据 |
|------|------|------|
| ① Unit Spec | [x] | 本文件 |
| ② PRD 验收条款 | [x] | §4 |
| ③ **Testing case** | [x] | `business-chain-tree.spec.ts` |
| ④ Coding | [x] | `tree.ts` |
| ⑤ Unit test 绿灯 | [x] | 4/4 pass |
| ⑥ E2E | [x] N/A | 纯 lib |

## 8. 完成证据

```bash
cd repo-main
pnpm test:unit -- tests/unit/business-chain-tree.spec.ts
```
