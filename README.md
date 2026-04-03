# zle-pipeline-core

Schema validation is not enough for product images: this CLI fails early on naming and asset issues before they break publish.

## The problem

Teams often ship datasets that are structurally valid JSON but operationally broken: duplicate IDs, weak file naming, missing cover candidates, or inconsistent image sets. These errors usually appear late in publishing or storefront rendering.

`zle-pipeline-core` is a small fail-closed pipeline for that gap: **ingest → curate → stage → publish**.

## Real-world failure cases this catches

- Duplicate product IDs in one run.
- Products with no source images.
- Products without a usable cover candidate.
- Source sets larger than policy allows (max 5).
- Unsupported image extensions.
- Suspicious source paths (`..`, absolute paths, backslashes, invalid characters).

## Policy decisions (explicit)

This project intentionally uses strict defaults for deterministic pipelines:
- Cover candidate rule: filename must include `cover`, `hero`, or `main`.
- Allowed extensions: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Path hygiene: local relative paths only, no traversal patterns.

These are **policy choices**, not universal truths. Tune them in `src/core/image-rules.ts` for your domain.

## Fail-closed behavior (practical)

If validation, staging, or manifest consistency checks fail, command exits non-zero and pipeline stops. No partial publish state.

## Repository structure

```text
zle-pipeline-core/
  package.json
  tsconfig.json
  README.md
  LICENSE
  .gitignore
  src/
    cli/
      ingest.ts
      curate.ts
      stage.ts
      publish.ts
    core/
      schema.ts
      validate.ts
      image-rules.ts
      images.ts
      pipeline.ts
    utils/
      fs.ts
      log.ts
    index.ts
  examples/
    dataset.json
    run.sh
```

## Install

```bash
npm install
```

## Usage

### Happy path

```bash
npm run demo
```

### Manual flow

```bash
npm run ingest
npm run curate -- --run-id <RUN_ID>
npm run stage -- --run-id <RUN_ID>
npm run publish -- --run-id <RUN_ID>
```

## Output structure

```text
tmp/
  <runId>/
    dataset.json
    curated.json
    manifest.json
    products/
      <productId>/
        cover.jpg
        01.jpg
```

## Why this exists

To provide a compact, credible core for teams that want strict image-set quality gates before adding storage, processing, and orchestration layers.

## Sponsor

If this helps your product data operations, sponsorship directly supports maintenance.
