import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Lấy __dirname tương đương trong ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn đến file popup.html trong thư mục dist
const popupHtmlPath = path.join(__dirname, 'dist', 'popup.html');

// Tìm tên file CSS mới nhất
const assetsDir = path.join(__dirname, 'dist', 'assets');
const cssFiles = fs.readdirSync(assetsDir).filter(file => file.startsWith('popup-') && file.endsWith('.css'));
const latestCssFile = cssFiles.sort().pop();

if (!latestCssFile) {
  console.error('Không tìm thấy file CSS cho popup!');
  process.exit(1);
}

// Đọc nội dung file HTML hiện tại
let htmlContent = fs.readFileSync(popupHtmlPath, 'utf8');

// Thêm link CSS và sửa đường dẫn JS
htmlContent = htmlContent.replace('</head>', `  <link rel="stylesheet" href="./assets/${latestCssFile}" />
  <style>
    body {
      width: 400px;
      height: calc(100vh - 20px);
      max-height: 480px;
      min-height: 400px;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: white;
    }
    :root {
      --app-max-width: min(400px, 100%);
      --app-padding: 8px;
    }
    /* Tối ưu cho màn hình MacBook 13 inch */
    @media screen and (max-height: 800px) {
      body {
        height: calc(100vh - 10px);
        min-height: 380px;
      }
      .mantine-ScrollArea-root {
        max-height: calc(100vh - 120px) !important;
      }
    }
    /* Đảm bảo ScrollArea có chiều cao phù hợp */
    .mantine-ScrollArea-root {
      max-height: 380px;
    }
    /* Đảm bảo container có kích thước linh hoạt */
    .mantine-Container-root {
      max-width: min(400px, 100%) !important;
      background-color: white !important;
    }
  </style>
</head>`);

// Sửa đường dẫn JS
htmlContent = htmlContent.replace('src="/src/main.tsx"', 'src="./popup.js"');

// Ghi lại file
fs.writeFileSync(popupHtmlPath, htmlContent);

console.log(`✅ Đã sửa file popup.html thành công với CSS: ${latestCssFile}`);
