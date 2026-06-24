# 最小 CI 检查清单（本地/流水线一致）

目标：保证开发机与 CI 的检查项一致，避免“本地通过、流水线失败”。

## 1. 环境对齐

- Node.js 版本固定（建议 20.x LTS）。
- 包管理器固定为 `pnpm`。
- 锁文件必须入库（`pnpm-lock.yaml`）。
- CI 使用与本地一致的命令入口（统一走 `pnpm run ...`）。

## 2. 必须通过的最小门禁

1. 依赖安装：`pnpm install --frozen-lockfile`
2. 静态检查：`pnpm run lint`
3. 类型检查：`pnpm run typecheck`
4. 单元测试：`pnpm run test:unit`
5. 集成测试：`pnpm run test:integration`
6. E2E 冒烟：`pnpm run test:e2e:smoke`
7. 覆盖率阈值：`pnpm run test:coverage`

## 3. 覆盖率与质量阈值（MVP 最小）

- 单元测试行覆盖率 >= 70%。
- 导出模块（exporter/normalizer/validator）行覆盖率 >= 85%。
- P0 用例通过率 100%。
- 核心场景总通过率 >= 95%。

## 4. 导出产物专项校验

- 产物必须包含：`config.json`、`manifest.json`、`data/entities.json`、`data/state_machines.json`、`data/rules.json`、`data/events.json`。
- `includeData=false` 时不得产出 `data/seed_data.json`。
- `manifest.json`、`config.json`、`data/entities.json` 必须通过 Schema 校验。

## 5. 本地与 CI 统一命令建议

在 `package.json` 中约定以下脚本（示例）：

```json
{
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e:smoke": "playwright test tests/e2e --grep @smoke",
    "test:coverage": "vitest run --coverage",
    "ci:check": "pnpm run lint && pnpm run typecheck && pnpm run test:unit && pnpm run test:integration && pnpm run test:e2e:smoke && pnpm run test:coverage"
  }
}
```

## 6. 失败处置规则（最小）

- 任一 P0 用例失败：阻断合并。
- 覆盖率低于阈值：阻断合并。
- E2E 冒烟失败：阻断合并。
- 仅 P2 非阻断项可放行，但需登记缺陷与修复计划。
