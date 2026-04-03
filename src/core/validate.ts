import { ZodError } from 'zod';
import { datasetSchema, type Dataset } from './schema.js';

export function validateDataset(input: unknown): Dataset {
  try {
    return datasetSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('\n');
      throw new Error(`Dataset validation failed:\n${details}`);
    }

    throw error;
  }
}
