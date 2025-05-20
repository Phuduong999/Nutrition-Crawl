/**
 * Content script for nutrition data extraction
 * 
 * This module is the main entry point for the Chrome extension content script.
 * It handles message communication with the popup and delegates the actual
 * nutrition data extraction to specialized services.
 */

// QUAN TRỌNG: Đặt bộ đếm thời gian lưu trữ trong window
declare global {
  interface Window {
    nutritionCrawlLoaded?: boolean;
  }
}

// Thiết lập biến toàn cục để đánh dấu content script đã tải
window.nutritionCrawlLoaded = true;

// Ghi nhận việc tải content script
console.log('%c[Nutrition-Crawl]%c Content script đã được tải! Đường dẫn:', 'background: #2aae53; color: white; font-weight: bold;', 'color: #2aae53; font-weight: bold;', window.location.href);

// Thêm marker vào document để kiểm tra trạng thái tải
try {
  document.documentElement.setAttribute('data-nutrition-crawl-loaded', 'true');
  console.log('[Nutrition-Crawl] Đã thêm marker vào document');
} catch (err) {
  console.error('[Nutrition-Crawl] Không thể thêm marker vào document:', err);
}

// Đảm bảo marker không bị xóa ngay cả khi DOM thay đổi
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'attributes' && 
        mutation.attributeName === 'data-nutrition-crawl-loaded' &&
        !document.documentElement.hasAttribute('data-nutrition-crawl-loaded')) {
      // Thiết lập lại nếu bị xóa
      document.documentElement.setAttribute('data-nutrition-crawl-loaded', 'true');
      console.log('[Nutrition-Crawl] Marker đã được thiết lập lại');
    }
  });
});

// Bắt đầu theo dõi - chỉ cần gọi 1 lần
observer.observe(document.documentElement, {
  attributes: true, 
  attributeFilter: ['data-nutrition-crawl-loaded']
});

// Gửi thông báo đã tải xong
try {
  chrome.runtime.sendMessage({ 
    action: 'contentScriptLoaded', // dùng đúng tên action mà background đợi
    url: window.location.href,
    timestamp: Date.now()
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to send loaded message:', chrome.runtime.lastError.message);
    } else if (response?.success) {
      console.log('Content script registered successfully');
    }
  });
} catch (error) {
  console.error('Error sending loaded message:', error);
}

// Thực hiện kiểm tra khả năng kết nối
function checkConnectionStatus() {
  return new Promise<boolean>((resolve) => {
    try {
      chrome.runtime.sendMessage({ action: 'ping' }, (_response) => {
        // Kiểm tra lỗi kết nối
        if (chrome.runtime.lastError) {
          console.warn('Connection status check failed:', chrome.runtime.lastError.message);
          resolve(false);
          return;
        }
        
        resolve(true);
      });
    } catch (error) {
      console.error('Exception during connection check:', error);
      resolve(false);
    }
  });
}

// Hàm keepAlive để duy trì kết nối với background
let keepAliveInterval: number | null = null;
let extensionContextValid = true;

function startKeepAlive() {
  if (!keepAliveInterval && extensionContextValid) {
    keepAliveInterval = window.setInterval(() => {
      if (!extensionContextValid) {
        // Nếu context đã không còn hợp lệ, dừng keepAlive
        stopKeepAlive();
        return;
      }

      try {
        chrome.runtime.sendMessage(
          { action: 'keepAlive', url: window.location.href },
          (_response) => { // Thêm dấu gạch dưới để đánh dấu biến không sử dụng
            if (chrome.runtime.lastError) {
              const errorMsg = chrome.runtime.lastError.message || '';
              console.warn('KeepAlive failed:', errorMsg);
              
              // Kiểm tra xem context có còn hợp lệ hay không
              if (errorMsg.includes('Extension context invalidated') ||
                  errorMsg.includes('context invalidated')) {
                extensionContextValid = false;
                stopKeepAlive();
                console.log('[Nutrition-Crawl] Extension context đã mất hiệu lực, dừng ping');
              }
            }
          }
        );
      } catch (error) {
        console.error('Exception during keepAlive:', error);
        // Kiểm tra context invalidated
        if (error instanceof Error && 
            error.message.includes('Extension context invalidated')) {
          extensionContextValid = false;
          stopKeepAlive();
          console.log('[Nutrition-Crawl] Extension context đã mất hiệu lực, dừng ping');
        }
      }
    }, 20000);
  }
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    window.clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Hàm kiểm tra và đăng ký lại content script nếu cần
async function checkAndReregister() {
  if (!extensionContextValid) {
    console.log('[Nutrition-Crawl] Extension context không còn hợp lệ, bỏ qua đăng ký lại');
    return;
  }

  if (await checkConnectionStatus()) {
    console.log('Kết nối đã được thiết lập');
    startKeepAlive();
  } else {
    console.warn('Kết nối không ổn định, thiết lập lại...');
    try {
      chrome.runtime.sendMessage(
        { action: 'contentScriptLoaded', url: window.location.href, timestamp: Date.now() },
        (response) => {
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message || '';
            console.warn('Không thể đăng ký lại content script:', errorMsg);
            
            // Kiểm tra lỗi context invalidated
            if (errorMsg.includes('Extension context invalidated') ||
                errorMsg.includes('context invalidated')) {
              extensionContextValid = false;
              console.log('[Nutrition-Crawl] Extension context đã mất hiệu lực, dừng các tương tác');
            }
          } else if (response?.success) {
            console.log('Content script đã được đăng ký lại thành công');
            startKeepAlive();
          }
        }
      );
    } catch (error) {
      console.error('Lỗi khi đăng ký lại content script:', error);
      // Kiểm tra lỗi context invalidated
      if (error instanceof Error && 
          error.message.includes('Extension context invalidated')) {
        extensionContextValid = false;
        console.log('[Nutrition-Crawl] Extension context đã mất hiệu lực, dừng các tương tác');
      }
    }
  }
}

// Thông báo với background script rằng content script đã được tải
try {
  chrome.runtime.sendMessage({ action: 'content_script_loaded', url: window.location.href }, (_response) => {
    if (chrome.runtime.lastError) {
      console.warn('Lỗi khi thông báo background script:', chrome.runtime.lastError.message);
      // Thử lại sau 2 giây
      setTimeout(checkAndReregister, 2000);
    } else {
      console.log('Background script đã nhận được thông báo content script đã tải');
      startKeepAlive(); // Bắt đầu duy trì kết nối
    }
  });
} catch (error) {
  console.error('Lỗi khi gửi thông báo:', error);
  // Thử lại sau 2 giây
  setTimeout(checkAndReregister, 2000);
}

// Kiểm tra lại kết nối sau một khoảng thời gian để đảm bảo đã được thiết lập
setTimeout(checkAndReregister, 5000);

import type { ExtractionResult } from './types';
import { NutritionExtractionService } from './service/extraction-service';
import { logger } from './utils';

/**
 * Initialize the nutrition extraction service
 */
const extractionService = new NutritionExtractionService();

/**
 * Main entry point for nutrition extraction
 * @param highlight Whether to highlight extracted elements
 * @returns Extraction result containing data and source map
 */
function extractNutritionInfo(highlight: boolean = false): ExtractionResult {
  try {
    return extractionService.extractNutritionInfo(highlight);
  } catch (error) {
    logger.error('Unexpected error during nutrition extraction', error);
    return { data: null, sourceMap: {} };
  }
}

// Cache của dữ liệu trích xuất gần đây nhất
let lastExtractedData: any = null;

// Đăng ký listener ngay lập tức để bắt đầu nhận tin nhắn
// QUAN TRỌNG: Đặt đăng ký lắng nghe sớm nhất có thể
const messageListener = (request: any, _sender: any, sendResponse: any) => {
  console.log('[Nutrition-Crawl] Received message:', request.action);
  
  // Trường hợp đặc biệt: kiểm tra kết nối
  if (request.action === 'ping') {
    console.log('[Nutrition-Crawl] Ping received, sending pong');
    sendResponse({ success: true, pong: true, timestamp: Date.now() });
    return true;
  }
  
  switch (request.action) {
    case 'extractNutrition':
      logger.info('Starting nutrition extraction...');
      // Extract with highlighting enabled
      const result = extractNutritionInfo(true);
      logger.info('Extraction result:', result);
      lastExtractedData = result.data; // Lưu lại dữ liệu để sử dụng cho các action khác
      
      // Capture screenshots of highlighted elements if data exists
      if (result.data) {
        logger.info('Data extracted successfully, creating preview...');
        // Define interface for source info to fix TypeScript errors
        interface SourceElementInfo {
          tagName: string;
          textContent: string;
          position: {
            top: number;
            left: number;
            width: number;
            height: number;
          };
        }
        
        // Create a map of element screenshots for the popup
        const previewData = {
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString(),
          data: result.data,
          // We won't store the actual DOM elements but rather info about them
          sourceInfo: {} as Record<string, SourceElementInfo>
        };
        
        // Get info about each highlighted element
        for (const [key, element] of Object.entries(result.sourceMap)) {
          if (element) {
            logger.info(`Processing element for key: ${key}`);
            // Store position info for each element
            const rect = element.getBoundingClientRect();
            previewData.sourceInfo[key] = {
              tagName: element.tagName,
              textContent: element.textContent?.trim().substring(0, 100) || '',
              position: {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height
              }
            };
          }
        }
        
        // Save to Chrome storage
        chrome.storage.local.set({ 'nutritionPreview': previewData }, () => {
          logger.info('Saved nutrition preview data to Chrome storage');
        });
      } else {
        logger.error('No data extracted from the page');
      }
      
      sendResponse({ success: !!result.data, data: result.data });
      break;
    
    case 'highlightNutritionElements':
      try {
        // Chỉ bôi vàng phần tử mà không trích xuất lại dữ liệu
        const highlightResult = extractionService.highlightElements();
        logger.info('Highlighted nutrition elements on page');
        sendResponse({ success: true, highlighted: highlightResult });
      } catch (error) {
        logger.error('Error highlighting nutrition elements', error);
        sendResponse({ success: false, error: `${error}` });
      }
      break;
      
    case 'copyNutritionData':
      // Trả về dữ liệu đã trích xuất trước đó
      if (lastExtractedData) {
        sendResponse({ success: true, data: lastExtractedData });
      } else {
        // Nếu chưa có dữ liệu, thử trích xuất mới
        const freshResult = extractNutritionInfo(false);
        sendResponse({ success: !!freshResult.data, data: freshResult.data });
      }
      break;
      
    case 'activateExtraction':
      // Thực hiện trích xuất thông qua trusted sources
      const { sourceName } = request;
      let activateResult;
      
      if (sourceName) {
        // Trích xuất dùng nguồn tin cậy cụ thể
        activateResult = extractionService.extractFromTrustedSource(sourceName);
      } else {
        // Trích xuất thông thường
        activateResult = extractNutritionInfo(true);
      }
      
      lastExtractedData = activateResult.data;
      sendResponse({ success: !!activateResult.data, data: activateResult.data });
      break;
      
    default:
      console.log(`[Nutrition-Crawl] Unknown action: ${request.action}`);
      logger.info(`Unknown action received: ${request.action}`);
      sendResponse({ success: false, error: `Không hiểu hành động: ${request.action}` });
  }
  
  return true; // QUAN TRỌNG: giữ kênh thông tin mở cho sendResponse bất đồng bộ
};

// Đăng ký listener ngay lập tức để đảm bảo bắt được mọi tin nhắn
chrome.runtime.onMessage.addListener(messageListener);
console.log('%c[Nutrition-Crawl]%c Đã đăng ký listener thành công!', 'background: #2aae53; color: white; font-weight: bold;', 'color: #2aae53; font-weight: bold;');

// Báo cáo trạng thái sẵn sàng cho background script
try {
  chrome.runtime.sendMessage({
    action: 'content_script_loaded',
    url: window.location.href,
    timestamp: Date.now(),
    ready: true
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[Nutrition-Crawl] Lỗi khi gửi thông báo đã tải:', chrome.runtime.lastError.message);
    } else if (response?.success) {
      console.log('[Nutrition-Crawl] Đã đăng ký thành công với background script');
    }
  });
} catch (error) {
  console.error('[Nutrition-Crawl] Lỗi khi gửi thông báo:', error);
}
