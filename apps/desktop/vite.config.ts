import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: 'renderer',
  plugins: [react()],
  resolve: {
    alias: {
      '@nova/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@nova/document': path.resolve(__dirname, '../../packages/document/src/index.ts'),
      '@nova/history': path.resolve(__dirname, '../../packages/history/src/index.ts'),
      '@nova/interaction': path.resolve(__dirname, '../../packages/interaction/src/index.ts'),
      '@nova/renderer': path.resolve(__dirname, '../../packages/renderer/src/index.ts'),
      '@nova/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@nova/assets': path.resolve(__dirname, '../../packages/assets/src/index.ts'),
      '@nova/components': path.resolve(__dirname, '../../packages/components/src/index.ts'),
      '@nova/animation': path.resolve(__dirname, '../../packages/animation/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
