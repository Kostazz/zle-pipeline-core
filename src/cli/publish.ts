import { coverPath, curatedPath, manifestPath, primaryPath } from '../core/pipeline.js';
import { validateManifest } from '../core/manifest-schema.js';
import { PRODUCT_ID_PATTERN } from '../core/schema.js';
import { validateDataset } from '../core/validate.js';
import { readJsonFile, statOrNull } from '../utils/fs.js';
import { success } from '../utils/log.js';

async function assertNonEmptyFile(filePath: string, label: string): Promise<void> {
  const stat = await statOrNull(filePath);

  if (!stat || !stat.isFile()) {
    throw new Error(`Publish check failed: missing required ${label} at ${filePath}`);
  }

  if (stat.size === 0) {
    throw new Error(`Publish check failed: empty required ${label} at ${filePath}`);
  }
}

function assertSafeProductId(productId: string): void {
  if (!PRODUCT_ID_PATTERN.test(productId)) {
    throw new Error(`Publish check failed: unsafe product id "${productId}"`);
  }
}

function duplicateIds(ids: string[]): string[] {
  const counts = new Map<string, number>();

  for (const id of ids) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();
}

function sortedIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

function idsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

export async function publish(runId: string): Promise<void> {
  const rawCurated = await readJsonFile<unknown>(curatedPath(runId));
  const curated = validateDataset(rawCurated);

  const manifestFile = manifestPath(runId);
  await assertNonEmptyFile(manifestFile, 'manifest file');

  const rawManifest = await readJsonFile<unknown>(manifestFile);
  const manifest = validateManifest(rawManifest);

  if (manifest.runId !== runId) {
    throw new Error(`Publish check failed: manifest runId (${manifest.runId}) does not match requested runId (${runId})`);
  }

  if (manifest.productCount !== manifest.products.length) {
    throw new Error(
      `Publish check failed: manifest productCount (${manifest.productCount}) does not match products length (${manifest.products.length})`
    );
  }

  const curatedIds = curated.products.map((product) => product.id);
  const manifestIds = manifest.products.map((product) => product.id);

  for (const id of [...curatedIds, ...manifestIds]) {
    assertSafeProductId(id);
  }

  const curatedDuplicates = duplicateIds(curatedIds);
  if (curatedDuplicates.length > 0) {
    throw new Error(`Publish check failed: curated data contains duplicate product ids: ${curatedDuplicates.join(', ')}`);
  }

  const manifestDuplicates = duplicateIds(manifestIds);
  if (manifestDuplicates.length > 0) {
    throw new Error(`Publish check failed: manifest contains duplicate product ids: ${manifestDuplicates.join(', ')}`);
  }

  const sortedCuratedIds = sortedIds(curatedIds);
  const sortedManifestIds = sortedIds(manifestIds);
  if (!idsEqual(sortedCuratedIds, sortedManifestIds)) {
    throw new Error('Publish check failed: manifest product IDs do not match curated product IDs');
  }

  for (const product of curated.products) {
    await assertNonEmptyFile(primaryPath(runId, product.id), `primary image for ${product.id}`);
    await assertNonEmptyFile(coverPath(runId, product.id), `cover image for ${product.id}`);
  }

  success(`Publish ready. runId=${runId}; products=${curated.products.length}; requiredFiles=${curated.products.length * 2 + 1}`);
}
