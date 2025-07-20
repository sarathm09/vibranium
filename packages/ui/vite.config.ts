import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Include .tsx files
      include: '**/*.{jsx,tsx}',
    }),
  ],
  
  // Development server configuration
  server: {
    port: 3000,
    host: true,
    open: false,
    hmr: {
      overlay: true,
    },
  },
  
  // Build configuration
  build: {
    outDir: resolve(__dirname, 'dist'),
    sourcemap: true,
    minify: 'esbuild',
    target: 'ES2020',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // Code splitting - simplified for better compatibility
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('router')) {
              return 'vendor';
            }
            if (id.includes('framer-motion') || id.includes('clsx')) {
              return 'utils';
            }
            if (id.includes('@heroicons')) {
              return 'icons';
            }
          }
        },
      },
    },
    // Optimize dependencies
    chunkSizeWarningLimit: 1000,
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@assets': resolve(__dirname, './src/assets'),
    },
  },
  
  // Enable CSS modules and preprocessing
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        // Variables are imported directly in each SCSS file
      },
    },
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'clsx',
      'framer-motion',
      '@heroicons/react/24/outline',
    ],
  },
  
  // Preview server (for production builds)
  preview: {
    port: 3001,
    host: true,
  },
  
  // Environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),
  },
});