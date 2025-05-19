/**
 * Content script for nutrition data extraction
 * 
 * This module is the main entry point for the Chrome extension content script.
 * It handles message communication with the popup and delegates the actual
 * nutrition data extraction to specialized services.
 */

// Debug marker để xác nhận content script đã được tải
console.log('[Nutrition-Crawl] Content script loaded', window.location.href);

// Thêm marker vào document để kiểm tra trạng thái tải
document.documentElement.setAttribute('data-nutrition-crawl-loaded', 'true');

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

// Bắt đầu theo dõi
observer.observe(document.documentElement, {
  attributes: true, 
  attributeFilter: ['data-nutrition-crawl-loaded']
});

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
function startKeepAlive() {
  if (keepAliveInterval) {
    return; // Đã đang chạy rồi
  }
  
  // Mỗi 20 giây, gửi một thông điệp để giữ kết nối 
  keepAliveInterval = window.setInterval(() => {
    try {
      chrome.runtime.sendMessage({ action: 'keepAlive', url: window.location.href }, () => {
        // Không cần xử lý phản hồi, chỉ giữ kết nối
        if (chrome.runtime.lastError) {
          console.warn('KeepAlive failed:', chrome.runtime.lastError.message);
        }
      });
    } catch (error) {
      console.error('Exception during keepAlive:', error);
    }
  }, 20000);
}

// Hàm kiểm tra và đăng ký lại content script nếu cần
async function ensureContentScriptRegistered() {
  // Kiểm tra khả năng kết nối
  const isConnected = await checkConnectionStatus();
  
  if (!isConnected) {
    console.warn('Kết nối không ổn định, thiết lập lại...');
    
    // Thử gửi thông điệp đăng ký lại
    try {
      chrome.runtime.sendMessage(
        { action: 'content_script_loaded', url: window.location.href, timestamp: Date.now() }, 
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Không thể đăng ký lại content script:', chrome.runtime.lastError.message);
          } else if (response?.success) {
            console.log('Content script đã được đăng ký lại thành công');
            startKeepAlive(); // Bắt đầu duy trì kết nối
          }
        });
    } catch (error) {
      console.error('Lỗi khi đăng ký lại content script:', error);
    }
  } else {
    console.log('Kết nối đã được thiết lập');
    startKeepAlive(); // Bắt đầu duy trì kết nối
  }
}

// Thông báo với background script rằng content script đã được tải
try {
  chrome.runtime.sendMessage({ action: 'content_script_loaded', url: window.location.href }, (_response) => {
    if (chrome.runtime.lastError) {
      console.warn('Lỗi khi thông báo background script:', chrome.runtime.lastError.message);
      // Thử lại sau 2 giây
      setTimeout(ensureContentScriptRegistered, 2000);
    } else {
      console.log('Background script đã nhận được thông báo content script đã tải');
      startKeepAlive(); // Bắt đầu duy trì kết nối
    }
  });
} catch (error) {
  console.error('Lỗi khi gửi thông báo:', error);
  // Thử lại sau 2 giây
  setTimeout(ensureContentScriptRegistered, 2000);
}

// Kiểm tra lại kết nối sau một khoảng thời gian để đảm bảo đã được thiết lập
setTimeout(ensureContentScriptRegistered, 5000);

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

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  logger.info(`Received message with action: ${request.action}`);

  // Xử lý các action khác nhau
  switch (request.action) {
    case 'extractNutrition':
      // Extract with highlighting enabled
      const result = extractNutritionInfo(true);
      lastExtractedData = result.data; // Lưu lại dữ liệu để sử dụng cho các action khác
      
      // Capture screenshots of highlighted elements if data exists
      if (result.data) {
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
      logger.info(`Unknown action received: ${request.action}`);
      sendResponse({ success: false, error: 'Unsupported action' });
  }
  
  return true; // Required for async response
});
