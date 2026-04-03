#!/usr/bin/env bash
set -euo pipefail

RUN_ID=$(FORCE_COLOR=0 npm run -s ingest | sed -n 's/^RUN_ID=//p' | tail -n 1)

if [[ -z "${RUN_ID}" ]]; then
  echo "Failed to parse RUN_ID from ingest output" >&2
  exit 1
fi

echo "Using run ID: ${RUN_ID}"
npm run -s curate -- --run-id "${RUN_ID}"
npm run -s stage -- --run-id "${RUN_ID}"
npm run -s publish -- --run-id "${RUN_ID}"
