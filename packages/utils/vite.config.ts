import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VibraniumUtils',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`
    },
    rollupOptions: {
      external: [
        '@vibraniumjs/types', 
        'yaml', 
        'chalk', 
        'uuid', 
        'fs', 
        'path', 
        'os',
        'stream',
        'fs/promises',
        'node:fs/promises',
        'node:stream',
        'node:path',
        'chokidar',
        'glob'
      ],
      output: {
        globals: {
          '@vibraniumjs/types': 'VibraniumTypes',
          'yaml': 'yaml',
          'chalk': 'chalk',
          'uuid': 'uuid'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  }
});