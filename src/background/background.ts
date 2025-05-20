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

// Thiết lập marker trên trang
const setContentScriptLoadedMarker = async (tabId: number): Promise<boolean> => {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                document.documentElement.setAttribute('data-nutrition-crawl-loaded', 'true');
                return true;
            }
        });
        return results[0]?.result === true;
    } catch (error) {
        console.error('Lỗi thiết lập marker:', error);
        return false;
    }
};

// Danh sách các tabs có content script đã được tải và thời gian gần nhất chúng gửi keepAlive
interface TabInfo {
    tabId: number;
    url: string;
    lastActivity: number;
    confirmed: boolean;
}

const contentScriptTabs = new Map<number, TabInfo>();

// Hàm xóa các tab không hoạt động quá lâu (30 giây không có keepAlive)
const cleanupInactiveTabs = () => {
    const now = Date.now();
    const expireTime = 30000; // 30 giây
    
    contentScriptTabs.forEach((info, tabId) => {
        if (now - info.lastActivity > expireTime) {
            console.log(`Tab ${tabId} không hoạt động quá lâu, xóa khỏi danh sách`);
            contentScriptTabs.delete(tabId);
            injectedTabs.delete(tabId);
        }
    });
};

// Thực hiện dọn dẹp tabs không hoạt động mỗi 30 giây
setInterval(cleanupInactiveTabs, 30000);

// Xử lý khi tab bị đóng
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
            console.log(`Tab ${tabId} đã được tải lại, cập nhật URL: ${tab.url}`);
            
            // Cập nhật thông tin trong contentScriptTabs
            if (contentScriptTabs.has(tabId)) {
                const tabInfo = contentScriptTabs.get(tabId)!;
                tabInfo.url = tab.url;
                tabInfo.confirmed = false; // Đặt thành false và chờ xác nhận mới từ content script
                contentScriptTabs.set(tabId, tabInfo);
            }
        } else {
            // Nếu URL không bắt đầu bằng http, xóa tab khỏi danh sách
            injectedTabs.delete(tabId);
            contentScriptTabs.delete(tabId);
        }
    }
});

// Hàm thực hiện inject content script và theo dõi kết quả
const executeContentScriptInject = async (tabId: number, sendResponse: (response: any) => void) => {
    try {
        console.log(`Đang inject content script vào tab ${tabId}...`);
        
        // Xóa tab khỏi danh sách các tab đã inject (nếu có)
        injectedTabs.delete(tabId);
        
        // Thử inject content script
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
        });
        
        console.log(`Đã inject content script vào tab ${tabId} thành công`);
        
        // Cơ chế kiểm tra với nhiều lần thử
        const checkWithRetry = async (remainingAttempts = 5) => {
            if (remainingAttempts <= 0) {
                console.warn(`Không thể xác nhận content script đã được tải trong tab ${tabId} sau nhiều lần thử`);
                sendResponse({ success: false, error: 'Không thể xác nhận content script đã được tải' });
                return;
            }
            
            // Kiểm tra xác nhận content script đã được tải
            try {
                const isLoaded = await checkContentScriptStatus(tabId);
                
                if (isLoaded) {
                    console.log(`Xác nhận content script đã được tải trong tab ${tabId}`);
                    injectedTabs.add(tabId);
                    sendResponse({ success: true });
                    
                    // Thêm vào danh sách tab hoạt động
                    contentScriptTabs.set(tabId, {
                        tabId: tabId,
                        url: '',  // Sẽ được cập nhật sau
                        lastActivity: Date.now(),
                        confirmed: true
                    });
                    
                    return;
                } else {
                    // Thử thiết lập marker trực tiếp
                    try {
                        await setContentScriptLoadedMarker(tabId);
                    } catch (err) {
                        console.warn(`Không thể thiết lập marker trực tiếp:`, err);
                    }
                    
                    console.log(`Lần thử ${6 - remainingAttempts}: Chưa tìm thấy marker, thử lại sau ${remainingAttempts <= 2 ? 1000 : 500}ms...`);
                    setTimeout(() => checkWithRetry(remainingAttempts - 1), remainingAttempts <= 2 ? 1000 : 500);
                }
            } catch (error) {
                console.error(`Lỗi kiểm tra content script (lần thử ${6 - remainingAttempts}):`, error);
                setTimeout(() => checkWithRetry(remainingAttempts - 1), 500);
            }
        };
        
        // Bắt đầu kiểm tra sau khoảng thời gian cho phép khởi tạo
        setTimeout(() => checkWithRetry(5), 800);
        
    } catch (err: any) {
        console.error(`Lỗi khi inject content script vào tab ${tabId}:`, err);
        sendResponse({ success: false, error: `Lỗi khi inject content script: ${err?.message || 'Không rõ lỗi'}` });
    }
};

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background: NHẬN TIN NHẮN:', request.action, sender?.tab?.id);
    
    // Xử lý tin nhắn ping từ content script hoặc popup
    if (request.action === 'ping') {
        sendResponse({ success: true, timestamp: Date.now(), from: 'background', pong: true });
        return true;
    }
    
    // Xử lý yêu cầu đăng ký tab vào danh sách injectedTabs
    if (request.action === 'registerTabAsInjected' && request.tabId) {
        const tabId = request.tabId;
        console.log(`Background: Đăng ký tab ${tabId} vào danh sách injectedTabs`);        
        injectedTabs.add(tabId);
        contentScriptTabs.set(tabId, {
            tabId: tabId,
            url: '', // Sẽ được cập nhật sau
            lastActivity: Date.now(),
            confirmed: true
        });
        sendResponse({ success: true, message: 'Tab đã được đăng ký vào danh sách injectedTabs' });
        return true;
    }
    
    // Proxy tin nhắn từ popup đến content script
    if (request.action === 'proxy_to_content_script' && request.tabId && request.proxyRequest) {
        const tabId = request.tabId;
        const proxyRequest = request.proxyRequest;
        
        console.log(`Background: Proxy tin nhắn "${proxyRequest.action}" tới tab ${tabId}`);
        
        // Kiểm tra tab có trong danh sách đã inject
        if (!injectedTabs.has(tabId)) {
            console.warn(`Background: Tab ${tabId} chưa được inject content script.`);
            sendResponse({
                success: false,
                error: 'Tab chưa được inject content script'
            });
            return true;
        }
        
        try {
            // Tạo flag kiểm tra xem response đã được gửi hay chưa
            let hasResponded = false;
            
            // Gọi sendMessage tới content script
            chrome.tabs.sendMessage(tabId, proxyRequest, (response) => {
                // Đảm bảo chỉ gọi sendResponse một lần
                if (hasResponded) return;
                hasResponded = true;
                
                if (chrome.runtime.lastError) {
                    console.error('Background: Lỗi proxy tin nhắn:', chrome.runtime.lastError);
                    try {
                        sendResponse({
                            success: false, 
                            error: chrome.runtime.lastError.message,
                            from: 'background_proxy'
                        });
                    } catch (responseErr) {
                        console.error('Không thể gửi phản hồi:', responseErr);
                    }
                    return;
                }
                
                console.log('Background: Phản hồi từ content script:', response);
                try {
                    sendResponse({
                        success: true,
                        data: response,
                        from: 'background_proxy'
                    });
                } catch (responseErr) {
                    console.error('Không thể gửi phản hồi:', responseErr);
                }
            });
            
            // Đặt timeout dự phòng nếu content script không trả lời
            setTimeout(() => {
                if (!hasResponded) {
                    hasResponded = true;
                    try {
                        sendResponse({
                            success: false,
                            error: 'Timeout: Content script không trả lời trong thời gian cho phép',
                            from: 'background_proxy'
                        });
                    } catch (timeoutErr) {
                        console.error('Không thể gửi phản hồi timeout:', timeoutErr);
                    }
                }
            }, 5000);
            
            return true; // QUAN TRỌNG: Giữ kết nối mở để xử lý bất đồng bộ
        } catch (err) {
            console.error('Background: Lỗi gọi proxy:', err);
            sendResponse({
                success: false,
                error: err instanceof Error ? err.message : 'Lỗi không xác định',
                from: 'background_proxy'
            });
            return true;
        }
    }

    // Xử lý tin nhắn keepAlive từ content script
    if (request.action === 'keepAlive') {
        if (sender.tab && sender.tab.id) {
            const tabId = sender.tab.id;
            const url = sender.tab.url || request.url || '';
            
            contentScriptTabs.set(tabId, {
                tabId,
                url,
                lastActivity: Date.now(),
                confirmed: true
            });
            
            // Đảm bảo tab này cũng có trong danh sách injectedTabs
            injectedTabs.add(tabId);
            
            console.log(`Content script trong tab ${tabId} vẫn hoạt động.`);
        }
        
        sendResponse({ success: true });
        return true;
    }

    // Xử lý thông báo content script đã tải
    if (request.action === 'contentScriptLoaded') {
        if (sender.tab && sender.tab.id) {
            const tabId = sender.tab.id;
            
            injectedTabs.add(tabId);
            contentScriptTabs.set(tabId, {
                tabId,
                url: sender.tab.url || '',
                lastActivity: Date.now(),
                confirmed: true
            });
            
            console.log(`Content script loaded in tab ${tabId}`);
            sendResponse({ success: true });
        }
        return true;
    }
    
    // Xử lý yêu cầu inject content script từ popup hoặc background
    if (request.action === 'injectContentScript') {
        const targetTabId = request.tabId;
        const force = request.force === true;
        
        if (!targetTabId) {
            sendResponse({ success: false, error: 'Không có tab ID hợp lệ' });
            return true;
        }
        
        console.log(`Yêu cầu inject cho tab ${targetTabId} (force=${force})`);
        
        // Kiểm tra xem tab đã được inject chưa
        if (!force && injectedTabs.has(targetTabId)) {
            console.log(`Tab ${targetTabId} đã được inject rồi. Trả về thành công ngay.`);
            sendResponse({ success: true });
            return true;
        }
        
        // Inject content script và theo dõi kết quả
        executeContentScriptInject(targetTabId, sendResponse);
        return true;
    }
    
    return false; // Không xử lý tin nhắn
});

// Helper function để tạo message thích hợp cho mỗi loại log
// @ts-ignore: Temporarily unused but will be needed later
function _getLogMessage(logData: any): string {
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
