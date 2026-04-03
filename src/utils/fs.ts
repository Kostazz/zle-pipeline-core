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
