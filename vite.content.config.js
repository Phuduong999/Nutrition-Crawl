import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/content',
    emptyOutDir: true,
    minify: true,
    target: 'es2015',
    lib: {
      entry: resolve(__dirname, 'src/content/content.ts'),
      name: 'NutritionCrawlContent',
      fileName: 'content',
      formats: ['iife'] // Chỉ sử dụng format IIFE
    },
    rollupOptions: {
      external: ['chrome'],
      output: {
        globals: {
          chrome: 'chrome'
        },
        // Đảm bảo không tạo ra các file chunk riêng biệt
        manualChunks: undefined,
        inlineDynamicImports: true,
        assetFileNames: (assetInfo) => {
          // Đảm bảo các assets được nhúng nếu có thể
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          return `assets/[name]-[hash][extname]`;
        }
      }
    }
  },
  // Đảm bảo cấu hình này để tránh ngắt dòng import
  optimizeDeps: {
    include: ['*'] // Bao gồm tất cả dependencies
  }
});
