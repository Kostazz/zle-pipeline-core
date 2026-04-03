import { validateImageRules } from '../core/image-rules.js';
import { writeDeterministicImage } from '../core/images.js';
import { buildManifest, curatedPath, expectedManifestProducts, manifestPath, productDir } from '../core/pipeline.js';
import { validateDataset } from '../core/validate.js';
import { ensureDir, readJsonFile, writeJsonFile } from '../utils/fs.js';
import { success } from '../utils/log.js';

export async function stage(runId: string): Promise<void> {
  const rawCurated = await readJsonFile<unknown>(curatedPath(runId));
  const curated = validateDataset(rawCurated);
  const imageRuleErrors = validateImageRules(curated);

  if (imageRuleErrors.length > 0) {
    throw new Error(`Curated data failed image policy checks:\n${imageRuleErrors.join('\n')}`);
  }

  const manifestProducts = expectedManifestProducts(curated.products);

  for (const product of manifestProducts) {
    const currentProductDir = productDir(runId, product.id);

    await ensureDir(currentProductDir);
    await writeDeterministicImage(currentProductDir, '01.jpg', product.id, product.primarySource);
    await writeDeterministicImage(currentProductDir, 'cover.jpg', product.id, product.coverSource);
  }

  await writeJsonFile(manifestPath(runId), buildManifest(runId, manifestProducts));
  success(`Stage complete. runId=${runId}; products=${manifestProducts.length}`);
}
