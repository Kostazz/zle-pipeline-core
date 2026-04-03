import { z } from 'zod';
import { PRODUCT_ID_PATTERN } from './schema.js';

export const manifestProductSchema = z.object({
  id: z.string().regex(PRODUCT_ID_PATTERN),
  category: z.string().min(1),
  sourceImageCount: z.number().int().min(1),
  stagedFiles: z.tuple([z.literal('cover.jpg'), z.literal('01.jpg')]),
  outputMap: z.object({
    cover: z.literal('cover.jpg'),
    primary: z.literal('01.jpg')
  }),
  coverSource: z.string().min(1),
  primarySource: z.string().min(1)
});

export const manifestSchema = z.object({
  version: z.literal(1),
  runId: z.string().min(1),
  productCount: z.number().int().min(0),
  products: z.array(manifestProductSchema)
});

export type Manifest = z.infer<typeof manifestSchema>;
