import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lessonsData } from '../src/data/lessons';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const outputArg = process.argv[2];
if (!outputArg) {
  throw new Error('Usage: tsx scripts/exportV5DocumentData.ts <output.json>');
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, file), 'utf8'));
}

const payload = {
  generatedAt: new Date().toISOString(),
  sourceFiles: {
    legacyLessons: 'src/data/lessons/u1.ts…u22.ts',
    curriculum: 'content/v5/curriculum.json',
    glossary: 'content/v5/glossary.json',
    audioManifest: 'public/audio/manifest.v2.json',
  },
  lessons: lessonsData,
  curriculum: readJson('content/v5/curriculum.json'),
  glossary: readJson('content/v5/glossary.json'),
  audioManifest: readJson('public/audio/manifest.v2.json'),
};

const outputPath = path.resolve(outputArg);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Exported V5 document data to ${outputPath}`);
