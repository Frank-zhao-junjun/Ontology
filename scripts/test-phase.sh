#!/bin/bash
# Phase-level regression for simplified architecture (US-S03~S13)
# Unix/Coze 环境可用；Windows 请用 pnpm run test:phaseN（package.json 内联 vitest）
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

if [[ -f "Ontology/package.json" ]]; then
  cd "Ontology"
elif [[ -f "package.json" ]]; then
  cd "${COZE_WORKSPACE_PATH}"
else
  echo "Error: package.json not found" >&2
  exit 1
fi

PHASE="${1:-}"
if [[ -z "$PHASE" ]]; then
  echo "Usage: $0 <1|1.5|2|3|4|all>" >&2
  exit 1
fi

run_vitest() {
  echo "→ vitest run $*"
  pnpm vitest run "$@"
}

phase1() {
  echo "=== Phase 1: S03 module-version + S04 business-chain + S05 saveEpc ==="
  run_vitest \
    tests/unit/module-version.spec.ts \
    tests/unit/module-version-store.spec.ts \
    tests/unit/business-chain-tree.spec.ts \
    tests/unit/business-chain-store.spec.ts \
    tests/unit/business-chain-module-status.spec.ts \
    tests/unit/save-epc.spec.ts \
    tests/unit/save-epc-store.spec.ts \
    tests/unit/validate-save-epc.spec.ts \
    tests/unit/rebuild-usage-index.spec.ts \
    tests/unit/upsert-inline.spec.ts \
    tests/integration/business-chain-tree.spec.tsx \
    tests/integration/business-chain-confirm.spec.tsx \
    tests/e2e/business-chain-tree.e2e.spec.ts
}

phase1_5() {
  echo "=== Phase 1.5: S14 module confirm/archive UI ==="
  run_vitest \
    tests/unit/confirm-flow.spec.ts \
    tests/integration/business-chain-confirm.spec.tsx \
    tests/integration/module-detail-actions.spec.tsx \
    tests/integration/version-history-panel.spec.tsx \
    tests/e2e/module-confirm.e2e.spec.ts
}

phase2() {
  echo "=== Phase 2: S06 element-selector + S07 element-library + S08 scenario-workspace ==="
  run_vitest \
    tests/unit/element-selector.spec.ts \
    tests/unit/element-library.spec.ts \
    tests/unit/element-library-store.spec.ts \
    tests/unit/scenario-workspace.spec.ts \
    tests/unit/scenario-workspace-store.spec.ts \
    tests/integration/element-selector.spec.tsx \
    tests/integration/element-library.spec.tsx \
    tests/integration/scenario-workspace.spec.tsx \
    tests/integration/epc-steps-editor.spec.tsx \
    tests/e2e/epc-element-selector.e2e.spec.ts \
    tests/e2e/element-library.e2e.spec.ts \
    tests/e2e/scenario-workspace.e2e.spec.ts
}

phase3() {
  echo "=== Phase 3: S09 linter + S10 excel + S11 ai-draft ==="
  run_vitest \
    tests/unit/business-epc-linter.spec.ts \
    tests/unit/business-epc-linter-store.spec.ts \
    tests/unit/excel-schema.spec.ts \
    tests/unit/excel-export.spec.ts \
    tests/unit/excel-import.spec.ts \
    tests/unit/ai-draft.spec.ts \
    tests/unit/ai-draft-store.spec.ts \
    tests/unit/generate-module-draft-route.spec.ts \
    tests/integration/warning-center.spec.tsx \
    tests/integration/ai-draft-fill.spec.tsx \
    tests/e2e/warning-center.e2e.spec.ts \
    tests/e2e/excel-import-export.e2e.spec.ts
}

phase4() {
  echo "=== Phase 4: S12 legacy removal + S13 compiler golden ==="
  run_vitest \
    tests/unit/legacy-audit.spec.ts \
    tests/unit/legacy-entrypoints-audit.spec.ts \
    tests/unit/legacy-removal-store.spec.ts \
    tests/unit/legacy-migration.spec.ts \
    tests/unit/business-scenario-migration.spec.ts \
    tests/unit/compile-simplified-chain.spec.ts \
    tests/unit/manifest-manufacturing-golden.spec.ts
}

case "$PHASE" in
  1) phase1 ;;
  1.5) phase1_5 ;;
  2) phase2 ;;
  3) phase3 ;;
  4) phase4 ;;
  all)
    phase1
    phase1_5
    phase2
    phase3
    phase4
    ;;
  *)
    echo "Unknown phase: $PHASE (use 1, 1.5, 2, 3, 4, or all)" >&2
    exit 1
    ;;
esac

echo "✅ Phase $PHASE regression passed"
