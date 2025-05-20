import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Đường dẫn tương đối đến file trong thư mục dist
  base: './',
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'public/popup.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    },
    // Đảm bảo base URL là đúng để tải các file
    assetsInlineLimit: 4096,
    modulePreload: false,
    sourcemap: true, // Thêm sourcemap để dễ debug
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
