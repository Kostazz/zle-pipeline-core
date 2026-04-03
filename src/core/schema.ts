import { z } from 'zod';

export const PRODUCT_ID_PATTERN = /^[a-z0-9-]+$/;
export const productIdSchema = z.string().min(3).max(64).regex(PRODUCT_ID_PATTERN);

export const productSchema = z.object({
  id: productIdSchema,
  name: z.string().min(2).max(120),
  category: z.enum(['gear', 'apparel', 'home', 'digital']),
  sourceImages: z.array(z.string().min(1)).min(1),
  price: z.number().positive().max(10000).optional()
});

export const datasetSchema = z.object({
  products: z.array(productSchema).min(1)
});

export type Product = z.infer<typeof productSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
