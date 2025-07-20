import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VibraniumPlugins',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`
    },
    rollupOptions: {
      external: ['@vibraniumjs/types', '@vibraniumjs/core'],
      output: {
        globals: {
          '@vibraniumjs/types': 'VibraniumTypes',
          '@vibraniumjs/core': 'VibraniumCore'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  }
});