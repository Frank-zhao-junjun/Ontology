#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
# If running from parent directory (Ontology as subdir), adjust path
if [[ -f "Ontology/package.json" ]]; then
  cd "Ontology"
elif [[ -f "package.json" ]]; then
  # Already in Ontology directory, stay here
  :
fi

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only
