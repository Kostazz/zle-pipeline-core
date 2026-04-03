import path from 'node:path';
import type { Dataset, Product } from './schema.js';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const HERO_TOKENS = ['cover', 'hero', 'main'];
const MAX_SOURCE_IMAGES = 5;
// Policy: keep paths local and predictable for deterministic pipelines.
const SAFE_PATH_PATTERN = /^[a-z0-9/_\-.]+$/i;

function isSuspiciousPath(imagePath: string): boolean {
  if (imagePath.startsWith('/') || imagePath.includes('..') || imagePath.includes('\\')) {
    return true;
  }

  if (!SAFE_PATH_PATTERN.test(imagePath)) {
    return true;
  }

  return false;
}

function hasHeroCandidate(product: Product): boolean {
  return product.sourceImages.some((imagePath) => {
    const name = path.basename(imagePath).toLowerCase();
    return HERO_TOKENS.some((token) => name.includes(token));
  });
}

function validateProductImages(product: Product): string[] {
  const errors: string[] = [];

  if (product.sourceImages.length === 0) {
    errors.push(`Product ${product.id}: must include at least 1 source image.`);
  }

  if (product.sourceImages.length > MAX_SOURCE_IMAGES) {
    errors.push(`Product ${product.id}: has ${product.sourceImages.length} source images; max allowed is ${MAX_SOURCE_IMAGES}.`);
  }

  if (!hasHeroCandidate(product)) {
    errors.push(`Product ${product.id}: missing cover/hero candidate in sourceImages (expected filename containing cover, hero, or main).`);
  }

  product.sourceImages.forEach((imagePath, index) => {
    const ext = path.extname(imagePath).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      errors.push(
        `Product ${product.id}: sourceImages[${index}] uses unsupported extension "${ext || '<none>'}" (allowed: .jpg, .jpeg, .png, .webp).`
      );
    }

    if (isSuspiciousPath(imagePath)) {
      errors.push(
        `Product ${product.id}: sourceImages[${index}] path "${imagePath}" is suspicious; use relative paths with letters, numbers, /, -, _, .`
      );
    }
  });

  return errors;
}

export function pickCoverSource(product: Product): string {
  const candidate = product.sourceImages.find((imagePath) => {
    const name = path.basename(imagePath).toLowerCase();
    return HERO_TOKENS.some((token) => name.includes(token));
  });

  if (!candidate) {
    throw new Error(`Product ${product.id}: missing cover/hero candidate in sourceImages.`);
  }

  return candidate;
}

export function validateImageRules(dataset: Dataset): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const product of dataset.products) {
    if (seenIds.has(product.id)) {
      errors.push(`Duplicate product id: "${product.id}".`);
    }
    seenIds.add(product.id);

    errors.push(...validateProductImages(product));
  }

  return errors;
}
