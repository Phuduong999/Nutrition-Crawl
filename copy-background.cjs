// Script này sao chép background.js từ src vào dist
// Sử dụng CommonJS để tương thích với Node.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Tìm các file cần sao chép
const srcFile = path.resolve(__dirname, 'src/background/background.ts');
const destFile = path.resolve(__dirname, 'dist/background.js');

console.log(`Sao chép background script...`);
console.log(`Từ: ${srcFile}`);
console.log(`Đến: ${destFile}`);

// Biên dịch file TypeScript thành JavaScript sử dụng esbuild (cần cài đặt trước)
try {
  const esbuildCmd = `npx esbuild ${srcFile} --outfile=${destFile} --bundle --format=iife --platform=browser --target=es2015 --minify`;
  
  console.log(`Đang biên dịch background script với lệnh:`);
  console.log(esbuildCmd);
  
  exec(esbuildCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Lỗi khi biên dịch background script: ${error.message}`);
      // Thử phương án thay thế nếu esbuild không hoạt động
      try {
        // Đọc file source code
        const sourceCode = fs.readFileSync(srcFile, 'utf8');
        
        // Xử lý TypeScript cơ bản (chỉ loại bỏ các kiểu dữ liệu)
        const processedContent = sourceCode
          .replace(/:\s*[A-Za-z<>\[\]|(){}]+/g, '') // Xóa khai báo kiểu
          .replace(/<[A-Za-z<>\[\]|(){}]+>/g, '');  // Xóa generic parameters
        
        // Lưu vào file đích
        fs.writeFileSync(destFile, processedContent);
        console.log('Đã sao chép background.js bằng phương pháp thay thế (chỉ xóa type annotations)');
      } catch (fallbackError) {
        console.error(`Không thể sao chép background script: ${fallbackError}`);
      }
      return;
    }
    
    if (stderr) {
      console.warn(`esbuild stderr: ${stderr}`);
    }
    
    console.log(`Đã biên dịch background.js thành công`);
    
    // Kiểm tra xem file đã được tạo chưa
    if (fs.existsSync(destFile)) {
      // Đọc nội dung file để kiểm tra
      const content = fs.readFileSync(destFile, 'utf8');
      if (content.length > 0) {
        console.log(`File background.js đã được tạo với kích thước ${content.length} bytes`);
      } else {
        console.error('File background.js đã được tạo nhưng trống');
      }
    } else {
      console.error('Không thể tạo file background.js');
    }
  });
} catch (error) {
  console.error(`Lỗi: ${error.message}`);
}
