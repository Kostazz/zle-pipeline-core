import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { curate } from './cli/curate.js';
import { ingest } from './cli/ingest.js';
import { publish } from './cli/publish.js';
import { stage } from './cli/stage.js';
import { assertValidRunId } from './core/pipeline.js';
import { error } from './utils/log.js';

void yargs(hideBin(process.argv))
  .scriptName('zle-pipeline-core')
  .strict()
  .demandCommand(1)
  .command('ingest', 'Copy example dataset into a new run directory', {}, async () => {
    await ingest();
  })
  .command(
    'curate',
    'Validate run dataset and write curated output',
    (cmd) =>
      cmd.option('run-id', {
        type: 'string',
        demandOption: true,
        describe: 'Run ID produced by ingest'
      }),
    async (args) => {
      await curate(assertValidRunId(args.runId as string));
    }
  )
  .command(
    'stage',
    'Create deterministic staged product artifacts',
    (cmd) =>
      cmd.option('run-id', {
        type: 'string',
        demandOption: true,
        describe: 'Run ID produced by ingest'
      }),
    async (args) => {
      await stage(assertValidRunId(args.runId as string));
    }
  )
  .command(
    'publish',
    'Verify staged artifacts and print publish-ready summary',
    (cmd) =>
      cmd.option('run-id', {
        type: 'string',
        demandOption: true,
        describe: 'Run ID produced by ingest'
      }),
    async (args) => {
      await publish(assertValidRunId(args.runId as string));
    }
  )
  .fail((msg, err) => {
    error(msg ?? err?.message ?? 'Command failed');
    process.exit(1);
  })
  .help()
  .parseAsync();
