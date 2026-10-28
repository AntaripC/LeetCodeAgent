import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const websiteDir = path.join(rootDir, 'website');
const docsDir = path.join(rootDir, 'docs');

console.log('📦 Starting release packager...');

// 1. Ensure dist exists
if (!fs.existsSync(distDir)) {
  console.log('⚡ Building extension...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
}

// 2. Ensure website and docs directories exist
for (const dir of [
  websiteDir,
  docsDir,
  path.join(websiteDir, 'downloads'),
  path.join(docsDir, 'downloads'),
  path.join(websiteDir, 'assets'),
  path.join(docsDir, 'assets')
]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 3. Create zip of dist
const zipName = 'leetcode-copilot-extension.zip';
const zipTemp = path.join(rootDir, zipName);

console.log('🗜️ Packaging extension into ZIP...');
execSync(
  `cd "${distDir}" && rm -f "${zipTemp}" && zip -q -r "${zipTemp}" manifest.json index.html content-script.js editor-inject.js service-worker.js icons assets`,
  { stdio: 'inherit' }
);

// Copy zip to website and docs
fs.copyFileSync(zipTemp, path.join(websiteDir, 'downloads', zipName));
fs.copyFileSync(zipTemp, path.join(docsDir, 'downloads', zipName));
fs.unlinkSync(zipTemp);

console.log(`✅ Packaged ${zipName} into website/downloads/ and docs/downloads/`);
