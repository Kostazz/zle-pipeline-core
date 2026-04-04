import path from 'node:path';
import fs from 'fs-extra';

export async function readJsonFile<T>(filePath: string): Promise<T> {
  return fs.readJson(filePath) as Promise<T>;
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, value, { spaces: 2 });
}

export async function writeTextFile(filePath: string, contents: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, contents, 'utf8');
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function statOrNull(filePath: string) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

export async function lstatOrNull(filePath: string) {
  try {
    return await fs.lstat(filePath);
  } catch {
    return null;
  }
}

export async function assertDirectoryInsideRoot(expectedRoot: string, targetDir: string): Promise<void> {
  const rootStat = await fs.lstat(expectedRoot);
  if (rootStat.isSymbolicLink()) {
    throw new Error(`Unsafe directory: expected root is a symlink (${expectedRoot})`);
  }

  if (!rootStat.isDirectory()) {
    throw new Error(`Unsafe directory: expected root is not a directory (${expectedRoot})`);
  }

  const targetStat = await fs.lstat(targetDir);
  if (targetStat.isSymbolicLink()) {
    throw new Error(`Unsafe directory: target is a symlink (${targetDir})`);
  }

  if (!targetStat.isDirectory()) {
    throw new Error(`Unsafe directory: target is not a directory (${targetDir})`);
  }

  const rootReal = await fs.realpath(expectedRoot);
  const targetReal = await fs.realpath(targetDir);
  const relativePath = path.relative(rootReal, targetReal);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Unsafe directory: ${targetDir} resolves outside expected root ${expectedRoot}`);
  }
}

export async function assertRealDirInsideRoot(targetDir: string, expectedRoot: string): Promise<void> {
  await assertDirectoryInsideRoot(expectedRoot, targetDir);
}
