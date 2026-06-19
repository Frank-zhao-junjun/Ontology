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

echo "Building the Next.js project..."
pnpm next build

echo "Bundling server with tsup..."
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

echo "Build completed successfully!"
