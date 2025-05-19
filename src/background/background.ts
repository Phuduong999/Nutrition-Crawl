// Handle permission requests and tab management
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Lưu danh sách các tab đã inject content script
const injectedTabs = new Set<number>();

// Kiểm tra status của content script
const checkContentScriptStatus = async (tabId: number): Promise<boolean> => {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                return document.documentElement.hasAttribute('data-nutrition-crawl-loaded');
            }
        });
        return results[0]?.result === true;
    } catch (error) {
        console.error('Lỗi kiểm tra content script:', error);
        return false;
    }
};

// Kiểm tra nếu tab có hỗ trợ content script
const isTabSupported = async (tabId: number): Promise<boolean> => {
    try {
        const tab = await chrome.tabs.get(tabId);
        const url = tab.url || '';
        
        // Kiểm tra nếu URL là HTTP/HTTPS và không phải là chrome:// hoặc chrome-extension://
        return url.startsWith('http') && 
               !url.startsWith('chrome://') && 
               !url.startsWith('chrome-extension://') &&
               !url.startsWith('about:');
    } catch (error) {
        console.error('Lỗi kiểm tra tab:', error);
        return false;
    }
};

// Thiết lập marker trên trang
const setContentScriptLoadedMarker = async (tabId: number): Promise<boolean> => {
    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                document.documentElement.setAttribute('data-nutrition-crawl-loaded', 'true');
            }
        });
        return true;
    } catch (error) {
        console.error('Lỗi thiết lập marker:', error);
        return false;
    }
};

// Danh sách các tabs có content script đã được tải và thời gian gần nhất chúng gửi keepAlive
interface TabInfo {
    tabId: number;
    url: string;
    lastActivity: number; // timestamp
    confirmed: boolean;   // đã được xác nhận là thực sự hoạt động
}

const contentScriptTabs = new Map<number, TabInfo>();

// Hàm xóa các tab không hoạt động quá lâu (30 giây không có keepAlive)
function cleanupInactiveTabs() {
    const now = Date.now();
    const maxInactivityTime = 30000; // 30 giây
    
    for (const [tabId, tabInfo] of contentScriptTabs.entries()) {
        if (now - tabInfo.lastActivity > maxInactivityTime) {
            console.log(`Tab ${tabId} không hoạt động trong ${maxInactivityTime/1000}s, xóa khỏi danh sách`);
            contentScriptTabs.delete(tabId);
            injectedTabs.delete(tabId);
        }
    }
}

// Thực hiện dọn dẹp tabs không hoạt động mỗi 30 giây
setInterval(cleanupInactiveTabs, 30000);

// Xử lý yêu cầu inject content script từ popup hoặc hotkey
// Thêm lắng nghe cho chrome.runtime.onInstalled
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed or updated!');
    
    // Xóa dữ liệu cũ khi cài đặt hoặc cập nhật
    contentScriptTabs.clear();
    injectedTabs.clear();
});

// Thêm lắng nghe cho tab update/active để đảm bảo tabs trong injectedTabs list vẫn còn hợp lệ
chrome.tabs.onRemoved.addListener((tabId) => {
    if (injectedTabs.has(tabId)) {
        console.log(`Tab ${tabId} đã được đóng, xóa khỏi danh sách inject`);
        injectedTabs.delete(tabId);
        contentScriptTabs.delete(tabId);
    }
});

// Cập nhật trạng thái của tab khi nó thay đổi
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && injectedTabs.has(tabId)) {
        if (tab.url && tab.url.startsWith('http')) {
            // Giữ nguyên tab trong danh sách injected nhưng gắn cờ confirmed = false
            // cho đến khi nhận được thông báo mới từ content script
            if (contentScriptTabs.has(tabId)) {
                const tabInfo = contentScriptTabs.get(tabId)!;
                tabInfo.confirmed = false;
                tabInfo.url = tab.url;
                contentScriptTabs.set(tabId, tabInfo);
            }
        } else {
            // Nếu URL không bắt đầu bằng http, xóa tab khỏi danh sách
            injectedTabs.delete(tabId);
            contentScriptTabs.delete(tabId);
        }
    }
});

// Thêm lắng nghe cho chrome.runtime.onConnect
chrome.runtime.onConnect.addListener((port) => {
    console.log('Port connected:', port.name);
    
    port.onDisconnect.addListener(() => {
        console.log('Port disconnected:', port.name);
    });
    
    port.onMessage.addListener((message) => {
        console.log('Message received via port:', message);
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Xử lý tin nhắn ping từ content script
    if (request.action === 'ping') {
        sendResponse({ success: true, timestamp: Date.now() });
        return true;
    }
    
    // Xử lý tin nhắn keepAlive từ content script
    if (request.action === 'keepAlive') {
        if (sender.tab?.id) {
            const tabId = sender.tab.id;
            const url = sender.tab.url || request.url || '';
            
            // Cập nhật thời gian hoạt động mới nhất của tab
            if (contentScriptTabs.has(tabId)) {
                const tabInfo = contentScriptTabs.get(tabId)!;
                tabInfo.lastActivity = Date.now();
                tabInfo.url = url;
                contentScriptTabs.set(tabId, tabInfo);
            } else {
                // Nếu tab chưa có trong danh sách, thêm vào
                contentScriptTabs.set(tabId, {
                    tabId, 
                    url, 
                    lastActivity: Date.now(), 
                    confirmed: true
                });
                injectedTabs.add(tabId);
            }
        }
        sendResponse({ success: true });
        return true;
    }
    
    // Xử lý tin nhắn thông báo content script đã được tải
    if (request.action === 'content_script_loaded') {
        if (sender.tab?.id) {
            const tabId = sender.tab.id;
            const url = sender.tab.url || request.url || '';
            
            console.log(`Content script đã được tải vào tab ${tabId}: ${url}`);
            
            // Thêm tab vào danh sách các tab đã có content script
            contentScriptTabs.set(tabId, {
                tabId, 
                url, 
                lastActivity: Date.now(), 
                confirmed: true
            });
            injectedTabs.add(tabId);
        }
        sendResponse({ success: true });
        return true;
    }
    
    // Xử lý yêu cầu inject content script
    if (request.action === 'injectContentScript') {
        const tabId = request.tabId;
        
        if (!tabId) {
            sendResponse({ success: false, error: 'Không có tabId được cung cấp' });
            return true;
        }
        
        // Kiểm tra nếu tab có hỗ trợ content script
        isTabSupported(tabId).then(supported => {
            if (!supported) {
                console.warn(`Tab ${tabId} không hỗ trợ content script (có thể là chrome:// hoặc extension)`);
                sendResponse({ success: false, error: 'Trang này không hỗ trợ content script. Hãy thử với trang web thông thường.' });
                return;
            }
            
            // Kiểm tra trước nếu content script đã được tải
            checkContentScriptStatus(tabId).then(isLoaded => {
                if (isLoaded) {
                    console.log(`Content script đã được tải vào tab ${tabId}`);
                    injectedTabs.add(tabId);
                    sendResponse({ success: true });
                    return;
                }
            
            // Nếu chưa tải, inject content script
            try {
                chrome.scripting.executeScript({
                    target: { tabId },
                    files: ['content.js']
                })
                .then(() => {
                    console.log(`Đã inject content.js vào tab ${tabId}`);
                    // Thiết lập marker sau khi inject thành công
                    return setContentScriptLoadedMarker(tabId);
                })
                .then(markerSet => {
                    if (markerSet) {
                        injectedTabs.add(tabId);
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, error: 'Không thể thiết lập marker' });
                    }
                })
                .catch((err) => {
                    console.warn(`Không thể inject content.js: ${err.message}`);
                    sendResponse({ success: false, error: err.message });
                });
            } catch (err) {
                console.error('Lỗi khi inject script:', err);
                if (err instanceof Error) {
                    sendResponse({ success: false, error: err.message });
                } else {
                    sendResponse({ success: false, error: 'Lỗi không xác định' });
                }
            }
            }).catch(error => {
                console.error('Lỗi kiểm tra trạng thái content script:', error);
                sendResponse({ success: false, error: 'Không thể kiểm tra trạng thái content script' });
            });
        }).catch(error => {
            console.error('Lỗi kiểm tra tab hỗ trợ:', error);
            sendResponse({ success: false, error: 'Không thể kiểm tra tab' });
        });
        
        return true; // Giữ kết nối mở để xử lý bất đồng bộ
    }
    
    // Xử lý các message logging từ content script
    if (request.action === 'log_xpath_extraction' || request.action === 'log_extraction_summary') {
        const logData = request.data;
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
    
    return false;
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
