// Script này sao chép content.js từ thư mục dist/content vào thư mục public
// Sử dụng CommonJS để tương thích với Node.js
const fs = require('fs');
const path = require('path');

// Tìm các file cần sao chép
const contentLibFile = path.resolve(__dirname, 'dist/content/content.iife.js');
const destFile = path.resolve(__dirname, 'public/content.js');

console.log(`Sao chép content script...`);
console.log(`Từ: ${contentLibFile}`);
console.log(`Đến: ${destFile}`);

// Đảm bảo thư mục public tồn tại
if (!fs.existsSync(path.resolve(__dirname, 'public'))) {
  fs.mkdirSync(path.resolve(__dirname, 'public'), { recursive: true });
}

try {
  // Đọc file content.js đã build
  if (fs.existsSync(contentLibFile)) {
    const content = fs.readFileSync(contentLibFile, 'utf8');
    
    // QUAN TRỌNG: Bỏ các câu lệnh import còn sót lại nếu có
    let processedContent = content;
    if (processedContent.includes('import')) {
      console.log('Phát hiện câu lệnh import, đang xử lý...');
      // Xóa các dòng import đầu tiên trong file
      processedContent = processedContent.replace(/import\s+[^;]+;?/g, '// imports removed');
    }
    
    // Ghi vào thư mục public
    fs.writeFileSync(destFile, processedContent);
    console.log('Đã sao chép và xử lý content.js thành công');
  } else {
    console.error(`Không tìm thấy file: ${contentLibFile}`);
    console.log('Kiểm tra các file trong thư mục dist/content:');
    if (fs.existsSync(path.resolve(__dirname, 'dist/content'))) {
      const files = fs.readdirSync(path.resolve(__dirname, 'dist/content'));
      console.log(files);
      
      // Nếu tìm thấy bất kỳ file JS nào, sử dụng file đầu tiên
      const jsFiles = files.filter(f => f.endsWith('.js'));
      if (jsFiles.length > 0) {
        const firstJsFile = path.resolve(__dirname, 'dist/content', jsFiles[0]);
        console.log(`Sử dụng file thay thế: ${firstJsFile}`);
        
        let content = fs.readFileSync(firstJsFile, 'utf8');
        // Xử lý các câu lệnh import nếu có
        if (content.includes('import')) {
          content = content.replace(/import\s+[^;]+;?/g, '// imports removed');
        }
        
        fs.writeFileSync(destFile, content);
        console.log('Đã sao chép file thay thế thành công');
      } else {
        throw new Error('Không tìm thấy file JS nào trong thư mục dist/content');
      }
    } else {
      throw new Error('Thư mục dist/content không tồn tại');
    }
  }
} catch (error) {
  console.error('Lỗi khi sao chép content.js:', error);
  process.exit(1);
}
