import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VibraniumHttpClient',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`
    },
    rollupOptions: {
      external: ['@vibraniumjs/types', 'got', 'axios'],
      output: {
        globals: {
          '@vibraniumjs/types': 'VibraniumTypes',
          'got': 'got',
          'axios': 'axios'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  }
});