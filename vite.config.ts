import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import * as esbuild from 'esbuild';

// Plugin to compile standalone scripts (content script as IIFE, service worker as ESM, editor-inject as IIFE)
function chromeExtensionPlugin() {
  return {
    name: 'chrome-extension-postbuild',
    closeBundle() {
      const rootDir = import.meta.dirname;
      const distDir = path.resolve(rootDir, 'dist');

      // 1. Compile content script as standalone IIFE (no imports)
      esbuild.buildSync({
        entryPoints: [path.resolve(rootDir, 'src/content/content-script.ts')],
        outfile: path.resolve(distDir, 'content-script.js'),
        bundle: true,
        format: 'iife',
        target: 'chrome100',
        sourcemap: false
      });

      // 2. Compile editor inject script as standalone IIFE
      esbuild.buildSync({
        entryPoints: [path.resolve(rootDir, 'src/content/editor-inject.ts')],
        outfile: path.resolve(distDir, 'editor-inject.js'),
        bundle: true,
        format: 'iife',
        target: 'chrome100',
        sourcemap: false
      });

      // 3. Compile service worker as standalone ESM
      esbuild.buildSync({
        entryPoints: [path.resolve(rootDir, 'src/background/service-worker.ts')],
        outfile: path.resolve(distDir, 'service-worker.js'),
        bundle: true,
        format: 'esm',
        target: 'chrome100',
        sourcemap: false
      });

      // 4. Copy and format manifest.json
      const manifestSrc = path.resolve(rootDir, 'public/manifest.json');
      const manifestDest = path.resolve(distDir, 'manifest.json');
      if (fs.existsSync(manifestSrc)) {
        const manifest = JSON.parse(fs.readFileSync(manifestSrc, 'utf-8'));
        manifest.background = {
          service_worker: 'service-worker.js',
          type: 'module'
        };
        manifest.content_scripts = [
          {
            matches: [
              'https://leetcode.com/problems/*',
              'https://leetcode.cn/problems/*'
            ],
            js: ['content-script.js'],
            run_at: 'document_idle'
          }
        ];
        manifest.web_accessible_resources = [
          {
            resources: ['editor-inject.js'],
            matches: ['https://leetcode.com/*', 'https://leetcode.cn/*']
          }
        ];
        fs.mkdirSync(path.dirname(manifestDest), { recursive: true });
        fs.writeFileSync(manifestDest, JSON.stringify(manifest, null, 2), 'utf-8');
      }

      // 5. Ensure icons exist in dist/icons
      const iconsSrc = path.resolve(rootDir, 'public/icons');
      const iconsDest = path.resolve(distDir, 'icons');
      if (fs.existsSync(iconsSrc)) {
        fs.mkdirSync(iconsDest, { recursive: true });
        fs.cpSync(iconsSrc, iconsDest, { recursive: true });
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), chromeExtensionPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.resolve(import.meta.dirname, 'index.html')
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: []
  }
});
