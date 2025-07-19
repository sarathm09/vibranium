import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'bin/vibranium': resolve(__dirname, 'src/bin/vibranium.ts'),
        'bin/vm': resolve(__dirname, 'src/bin/vm.ts')
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'js';
        return entryName.includes('/') ? `${entryName}.${ext}` : `${entryName}.${ext}`;
      }
    },
    rollupOptions: {
      external: [
        '@vibraniumjs/types',
        '@vibraniumjs/utils',
        '@vibraniumjs/core',
        '@vibraniumjs/plugins',
        '@vibraniumjs/http-client',
        'ink',
        'react',
        'commander',
        'chalk'
      ]
    },
    outDir: 'dist',
    sourcemap: true
  }
});