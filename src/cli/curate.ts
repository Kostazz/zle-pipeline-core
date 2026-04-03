import { validateImageRules } from '../core/image-rules.js';
import { curatedPath, datasetPath } from '../core/pipeline.js';
import { validateDataset } from '../core/validate.js';
import { readJsonFile, writeJsonFile } from '../utils/fs.js';
import { success } from '../utils/log.js';

export async function curate(runId: string): Promise<void> {
  const input = await readJsonFile<unknown>(datasetPath(runId));
  const curated = validateDataset(input);
  const imageRuleErrors = validateImageRules(curated);

  if (imageRuleErrors.length > 0) {
    throw new Error(`Image validation failed:\n${imageRuleErrors.join('\n')}`);
  }

  await writeJsonFile(curatedPath(runId), curated);
  success(`Curate complete. runId=${runId}; products=${curated.products.length}`);
}
