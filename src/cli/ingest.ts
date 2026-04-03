import { generateRunId, datasetPath } from '../core/pipeline.js';
import { readJsonFile, writeJsonFile } from '../utils/fs.js';
import { success } from '../utils/log.js';

const EXAMPLES_DATASET_PATH = 'examples/dataset.json';

export async function ingest(): Promise<string> {
  const rawDataset = await readJsonFile<unknown>(EXAMPLES_DATASET_PATH);
  const runId = generateRunId();
  const outputPath = datasetPath(runId);

  await writeJsonFile(outputPath, rawDataset);

  success(`Ingest complete. runId=${runId}`);
  return runId;
}
