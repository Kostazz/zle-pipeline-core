import { coverPath, manifestPath, primaryPath } from '../core/pipeline.js';
import type { StageManifest } from '../core/pipeline.js';
import { readJsonFile, statOrNull } from '../utils/fs.js';
import { success } from '../utils/log.js';

const REQUIRED_STAGED_FILES = ['cover.jpg', '01.jpg'] as const;

async function assertNonEmptyFile(filePath: string, label: string): Promise<void> {
  const stat = await statOrNull(filePath);

  if (!stat || !stat.isFile()) {
    throw new Error(`Publish check failed: missing required ${label} at ${filePath}`);
  }

  if (stat.size === 0) {
    throw new Error(`Publish check failed: empty required ${label} at ${filePath}`);
  }
}

function assertManifestConsistency(manifest: StageManifest): void {
  if (manifest.productCount !== manifest.products.length) {
    throw new Error(
      `Publish check failed: manifest productCount (${manifest.productCount}) does not match products length (${manifest.products.length})`
    );
  }

  for (const product of manifest.products) {
    const files = [...product.stagedFiles].sort();
    const required = [...REQUIRED_STAGED_FILES].sort();

    if (files.length !== required.length || files.some((file, index) => file !== required[index])) {
      throw new Error(`Publish check failed: manifest stagedFiles mismatch for product ${product.id}`);
    }

    if (product.outputMap.cover !== 'cover.jpg' || product.outputMap.primary !== '01.jpg') {
      throw new Error(`Publish check failed: manifest outputMap mismatch for product ${product.id}`);
    }
  }
}

export async function publish(runId: string): Promise<void> {
  const manifestFile = manifestPath(runId);
  await assertNonEmptyFile(manifestFile, 'manifest file');

  const manifest = await readJsonFile<StageManifest>(manifestFile);
  assertManifestConsistency(manifest);

  for (const product of manifest.products) {
    await assertNonEmptyFile(primaryPath(runId, product.id), `primary image for ${product.id}`);
    await assertNonEmptyFile(coverPath(runId, product.id), `cover image for ${product.id}`);
  }

  success(`Publish ready. runId=${runId}; products=${manifest.productCount}; requiredFiles=${manifest.productCount * 2 + 1}`);
}
