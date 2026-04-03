import { pickCoverSource, validateImageRules } from '../core/image-rules.js';
import { writeDeterministicImage } from '../core/images.js';
import { buildManifest, curatedPath, manifestPath, productDir } from '../core/pipeline.js';
import type { Product } from '../core/schema.js';
import { validateDataset } from '../core/validate.js';
import { ensureDir, readJsonFile, writeJsonFile } from '../utils/fs.js';
import { success } from '../utils/log.js';

function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.id.localeCompare(b.id));
}

export async function stage(runId: string): Promise<void> {
  const rawCurated = await readJsonFile<unknown>(curatedPath(runId));
  const curated = validateDataset(rawCurated);
  const imageRuleErrors = validateImageRules(curated);

  if (imageRuleErrors.length > 0) {
    throw new Error(`Curated data failed image policy checks:\n${imageRuleErrors.join('\n')}`);
  }

  const sortedProducts = sortProducts(curated.products);
  const manifestProducts = [];

  for (const product of sortedProducts) {
    const currentProductDir = productDir(runId, product.id);
    const primarySource = product.sourceImages[0];

    if (!primarySource) {
      throw new Error(`Product ${product.id}: missing primary source image`);
    }

    const coverSource = pickCoverSource(product);

    await ensureDir(currentProductDir);
    await writeDeterministicImage(currentProductDir, '01.jpg', product.id, primarySource);
    await writeDeterministicImage(currentProductDir, 'cover.jpg', product.id, coverSource);

    manifestProducts.push({
      id: product.id,
      category: product.category,
      sourceImageCount: product.sourceImages.length,
      stagedFiles: ['cover.jpg', '01.jpg'] as const,
      outputMap: {
        cover: 'cover.jpg' as const,
        primary: '01.jpg' as const
      },
      coverSource,
      primarySource
    });
  }

  await writeJsonFile(manifestPath(runId), buildManifest(runId, manifestProducts));
  success(`Stage complete. runId=${runId}; products=${sortedProducts.length}`);
}
