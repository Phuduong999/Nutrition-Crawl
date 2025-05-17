import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Lấy __dirname tương đương trong ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn đến manifest.json
const sourceManifest = path.join(__dirname, 'public', 'manifest.json');
const destManifest = path.join(__dirname, 'dist', 'manifest.json');

// Copy manifest.json từ public vào dist
try {
  fs.copyFileSync(sourceManifest, destManifest);
  console.log('✅ Đã sao chép manifest.json thành công');
} catch (error) {
  console.error('❌ Lỗi khi sao chép manifest.json:', error);
  process.exit(1);
}
