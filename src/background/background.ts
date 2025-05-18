// Handle permission requests and tab management
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Xử lý các message logging từ content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'log_xpath_extraction' || message.action === 'log_extraction_summary') {
        const logData = message.data;
        // Thêm thông tin về tab
        if (sender.tab) {
            logData.tabId = sender.tab.id;
            logData.tabUrl = sender.tab.url;
        }
        
        // Lưu log vào chrome.storage để hiển thị trong UI
        const logType = logData.type || 'extraction';
        const logEntry = {
            type: logType,
            message: getLogMessage(logData),
            data: logData,
            timestamp: Date.now()
        };
        
        // Lưu log mới nhất để UI có thể hiển thị
        chrome.storage.local.set({ 'log_latest': logEntry });
        
        // Lưu log vào storage để có thể xem lại sau này
        chrome.storage.local.get(['xpath_logs'], (result) => {
            const logs = result.xpath_logs || [];
            logs.unshift(logEntry); // Thêm log mới vào đầu mảng
            
            // Giới hạn số lượng log để tránh quá tải storage
            if (logs.length > 1000) {
                logs.length = 1000;
            }
            
            chrome.storage.local.set({ 'xpath_logs': logs });
        });
        
        // Gửi phản hồi
        sendResponse({ success: true });
        return true; // Giữ kết nối mở khi xử lý bất đồng bộ
    }
});

// Helper function để tạo message thích hợp cho mỗi loại log
function getLogMessage(logData: any): string {
    switch (logData.type) {
        case 'xpath':
            return `[XPath] Trích xuất thành công: ${logData.description || logData.field} = ${logData.value}`;
        
        case 'text_search':
            return `[Text Search] Trích xuất thành công: ${logData.description || logData.field} = ${logData.value}`;
        
        case 'extraction_failed':
            return `[Thất bại] Không tìm thấy giá trị cho: ${logData.description || logData.field}`;
        
        case 'extraction_summary':
            return `[Tổng kết] Trích xuất: ${logData.successCount}/${logData.totalFields} trường thành công từ ${logData.domain}`;
        
        default:
            return `[Log] ${JSON.stringify(logData)}`;
    }
}

export { };
