import path from 'node:path';
import { writeTextFile } from '../utils/fs.js';

export async function writeDeterministicImage(productDir: string, fileName: string, productId: string, sourcePath: string): Promise<string> {
  const imagePath = path.join(productDir, fileName);
  const payload = `STAGED_IMAGE\nproduct=${productId}\nsource=${sourcePath}\nfile=${fileName}\nversion=1\n`;
  await writeTextFile(imagePath, payload);
  return imagePath;
}
