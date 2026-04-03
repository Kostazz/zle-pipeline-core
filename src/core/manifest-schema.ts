import { ZodError, z } from 'zod';
import { productIdSchema } from './schema.js';

export const manifestProductSchema = z.object({
  id: productIdSchema,
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

export function validateManifest(input: unknown): Manifest {
  try {
    return manifestSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('\n');
      throw new Error(`Manifest validation failed:\n${details}`);
    }

    throw error;
  }
}
