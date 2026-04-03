import { z } from 'zod';

export const productSchema = z.object({
  id: z.string().min(3).max(64).regex(/^[a-z0-9-]+$/),
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
