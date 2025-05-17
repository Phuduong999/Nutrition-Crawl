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
htmlContent = htmlContent.replace('</head>', `  <link rel="stylesheet" href="./assets/${latestCssFile}" />\n  <style>\n    body {\n      width: 400px;\n      height: 400px;\n      margin: 0;\n      padding: 0;\n      overflow: hidden;\n    }\n    :root {\n      --app-max-width: 390px;\n      --app-padding: 8px;\n    }\n  </style>\n</head>`);

// Sửa đường dẫn JS
htmlContent = htmlContent.replace('src="/src/main.tsx"', 'src="./popup.js"');

// Ghi lại file
fs.writeFileSync(popupHtmlPath, htmlContent);

console.log(`✅ Đã sửa file popup.html thành công với CSS: ${latestCssFile}`);
