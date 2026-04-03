#!/usr/bin/env bash
set -euo pipefail

RUN_ID=$(npm run -s ingest | sed -n 's/.*runId=\([^[:space:]]*\).*/\1/p')

echo "Using run ID: ${RUN_ID}"
npm run -s curate -- --run-id "${RUN_ID}"
npm run -s stage -- --run-id "${RUN_ID}"
npm run -s publish -- --run-id "${RUN_ID}"
