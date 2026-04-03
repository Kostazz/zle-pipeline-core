import path from 'node:path';
import { pickCoverSource } from './image-rules.js';
import { PRODUCT_ID_PATTERN, type Product } from './schema.js';

export const TMP_DIR = 'tmp';
const RUN_ID_PATTERN = /^run-[A-Za-z0-9_-]+$/;

export function generateRunId(now: Date = new Date()): string {
  const iso = now.toISOString().replace(/[.:]/g, '-');
  const seed = Math.random().toString(36).slice(2, 8);
  return `run-${iso}-${seed}`;
}

export function assertValidRunId(runId: string): string {
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new Error(`Invalid runId "${runId}". Expected format matching ${RUN_ID_PATTERN.toString()}`);
  }

  return runId;
}

export function assertValidProductId(productId: string): string {
  if (!PRODUCT_ID_PATTERN.test(productId)) {
    throw new Error(`Invalid productId "${productId}". Expected lowercase slug matching ${PRODUCT_ID_PATTERN.toString()}`);
  }

  return productId;
}

export function runRoot(runId: string): string {
  const safeRunId = assertValidRunId(runId);
  return path.join(TMP_DIR, safeRunId);
}

export function datasetPath(runId: string): string {
  return path.join(runRoot(runId), 'dataset.json');
}

export function curatedPath(runId: string): string {
  return path.join(runRoot(runId), 'curated.json');
}

export function manifestPath(runId: string): string {
  return path.join(runRoot(runId), 'manifest.json');
}

export function productsDir(runId: string): string {
  return path.join(runRoot(runId), 'products');
}

export function productDir(runId: string, productId: string): string {
  const safeProductId = assertValidProductId(productId);
  return path.join(productsDir(runId), safeProductId);
}

export function coverPath(runId: string, productId: string): string {
  return path.join(productDir(runId, productId), 'cover.jpg');
}

export function primaryPath(runId: string, productId: string): string {
  return path.join(productDir(runId, productId), '01.jpg');
}

export type ManifestProduct = {
  id: string;
  category: string;
  sourceImageCount: number;
  stagedFiles: ['cover.jpg', '01.jpg'];
  outputMap: {
    cover: 'cover.jpg';
    primary: '01.jpg';
  };
  coverSource: string;
  primarySource: string;
};

export type StageManifest = {
  version: 1;
  runId: string;
  productCount: number;
  products: ManifestProduct[];
};

export function expectedManifestProducts(products: Product[]): ManifestProduct[] {
  const sortedProducts = [...products].sort((a, b) => a.id.localeCompare(b.id));

  return sortedProducts.map((product) => {
    const primarySource = product.sourceImages[0];
    if (!primarySource) {
      throw new Error(`Product ${product.id}: missing primary source image`);
    }

    const coverSource = pickCoverSource(product);

    return {
      id: product.id,
      category: product.category,
      sourceImageCount: product.sourceImages.length,
      stagedFiles: ['cover.jpg', '01.jpg'],
      outputMap: {
        cover: 'cover.jpg',
        primary: '01.jpg'
      },
      coverSource,
      primarySource
    };
  });
}

export function buildManifest(runId: string, products: ManifestProduct[]): StageManifest {
  const sorted = [...products].sort((a, b) => a.id.localeCompare(b.id));

  return {
    version: 1,
    runId,
    productCount: sorted.length,
    products: sorted
  };
}
