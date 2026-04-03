import { coverPath, curatedPath, manifestPath, primaryPath } from '../core/pipeline.js';
import { manifestSchema } from '../core/manifest-schema.js';
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

export async function publish(runId: string): Promise<void> {
  const rawCurated = await readJsonFile<unknown>(curatedPath(runId));
  const curated = validateDataset(rawCurated);

  const manifestFile = manifestPath(runId);
  await assertNonEmptyFile(manifestFile, 'manifest file');

  const rawManifest = await readJsonFile<unknown>(manifestFile);
  const manifest = manifestSchema.parse(rawManifest);

  if (manifest.productCount !== manifest.products.length) {
    throw new Error(
      `Publish check failed: manifest productCount (${manifest.productCount}) does not match products length (${manifest.products.length})`
    );
  }

  const curatedIds = new Set(curated.products.map((product) => product.id));
  const manifestIds = new Set(manifest.products.map((product) => product.id));

  for (const id of curatedIds) {
    assertSafeProductId(id);
    if (!manifestIds.has(id)) {
      throw new Error(`Publish check failed: manifest missing product ${id}`);
    }
  }

  if (manifestIds.size !== curatedIds.size) {
    throw new Error('Publish check failed: manifest product set does not match curated product set');
  }

  for (const product of curated.products) {
    await assertNonEmptyFile(primaryPath(runId, product.id), `primary image for ${product.id}`);
    await assertNonEmptyFile(coverPath(runId, product.id), `cover image for ${product.id}`);
  }

  success(`Publish ready. runId=${runId}; products=${curated.products.length}; requiredFiles=${curated.products.length * 2 + 1}`);
}
