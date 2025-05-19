// Bridge script để đảm bảo kết nối giữa popup và content script chính

// Đánh dấu trang đã được tải bridge script
document.documentElement.dataset.nutritionCrawlBridge = 'true';
console.log('[Nutrition-Crawl] Bridge script loaded', window.location.href);

// Thiết lập kênh truyền thông tin
const bridgePort = chrome.runtime.connect({ name: "nutrition-crawl-bridge" });

// Thông báo với background script rằng bridge đã được tải
bridgePort.postMessage({
  action: 'bridge_loaded',
  url: window.location.href
});

// Thiết lập sự kiện lắng nghe từ background
bridgePort.onMessage.addListener((msg) => {
  console.log('[Bridge] Received message from background:', msg);
  
  // Chuyển tiếp tin nhắn đến content script chính bằng custom event
  const event = new CustomEvent('nutrition-crawl-message', { 
    detail: msg 
  });
  document.dispatchEvent(event);
});

// Lắng nghe tin nhắn từ content script chính
document.addEventListener('nutrition-crawl-response', (event: any) => {
  const response = event.detail;
  console.log('[Bridge] Received response from main content script:', response);
  
  // Gửi phản hồi về background
  bridgePort.postMessage({
    action: 'content_response',
    data: response
  });
});

// Xử lý ping từ popup để kiểm tra kết nối
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Bridge] Received direct message:', message);
  
  if (message.action === 'ping') {
    sendResponse({ success: true, timestamp: Date.now(), source: 'bridge' });
    return true;
  }
  
  if (message.action === 'check_bridge') {
    sendResponse({ loaded: true, timestamp: Date.now() });
    return true;
  }
  
  // Truyền tin nhắn đến content script chính bằng custom event
  const event = new CustomEvent('nutrition-crawl-message', { 
    detail: message 
  });
  document.dispatchEvent(event);
  
  // Thiết lập timeout để đảm bảo phản hồi
  const timeout = setTimeout(() => {
    console.warn('[Bridge] No response from content script within timeout period');
    sendResponse({ error: 'Content script không phản hồi', source: 'bridge' });
  }, 2000);
  
  // Lắng nghe phản hồi từ content script một lần
  const responseHandler = (e: any) => {
    clearTimeout(timeout);
    document.removeEventListener('nutrition-crawl-response', responseHandler);
    sendResponse(e.detail);
  };
  
  document.addEventListener('nutrition-crawl-response', responseHandler, { once: true });
  return true;
});

console.log('[Nutrition-Crawl] Bridge script initialized');
