import { logger } from '../store/logStore';

/**
 * Tạo một tab Chrome mới và đợi cho đến khi nó load xong
 * @param url URL để mở trong tab mới
 * @returns Tab đã load xong
 */
export const createAndWaitForTab = async (url: string): Promise<chrome.tabs.Tab> => {
  logger.url(`Bắt đầu xử lý URL: ${url}`, {
    timestamp: new Date().toISOString()
  });
  
  // Sử dụng chromium API để mở tab mới
  const tab = await chrome.tabs.create({ url, active: false });
  logger.url(`Đã tạo tab với ID: ${tab.id}`, { tabId: tab.id });
  
  // Đợi trang tải xong (thêm timeout 10 giây)
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      logger.error(`Timeout khi tải tab: ${url}`, { tabId: tab?.id, timeout: '10s' });
      reject(new Error('Tab loading timeout after 10s'));
    }, 10000);

    const listener = (tabId: number, info: chrome.tabs.TabChangeInfo) => {
      if (tabId === tab!.id && info.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        logger.url(`Tab đã tải xong: ${url}`, { tabId, status: info.status });
        // Đợi thêm 2 giây để đảm bảo nội dung đã tải xong
        setTimeout(() => resolve(), 2000);
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
  
  logger.url(`Tab đã sẵn sàng: ${url}`);
  return tab;
};

/**
 * Thực thi script trong một tab
 * @param tabId ID của tab Chrome
 * @param func Function cần thực thi
 * @param args Tham số cho function 
 * @returns Kết quả thực thi script
 */
export const executeScriptInTab = async <T, A extends any[]>(
  tabId: number, 
  func: (...args: A) => T, 
  ...args: A
): Promise<T> => {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func,
      args
    });
    
    return results[0].result as T;
  } catch (error) {
    logger.error(`Lỗi khi thực thi script trong tab ${tabId}:`, error);
    throw error;
  }
};

/**
 * Đóng tab Chrome
 * @param tabId ID của tab cần đóng
 */
export const closeTab = async (tabId: number): Promise<void> => {
  try {
    await chrome.tabs.remove(tabId);
    logger.url(`Đã đóng tab ${tabId}`);
  } catch (error) {
    logger.error(`Lỗi khi đóng tab ${tabId}:`, error);
  }
};
