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
      external: ['@vibraniumjs/types', 'yaml', 'chalk', 'uuid', 'fs', 'path'],
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