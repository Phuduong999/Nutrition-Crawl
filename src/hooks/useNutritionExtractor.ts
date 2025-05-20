import { useState, useEffect, useCallback } from 'react';
import type { NutritionData, NutritionPreview } from '../types';
import { showSuccessNotification, showErrorNotification } from '../components/common/NotificationService';

// Định nghĩa interface cho response từ content script
interface ExtractNutritionResponse {
  success: boolean;
  error?: string;
  data?: NutritionData;
}

// Định nghĩa interface cho response từ injectContentScript
interface InjectContentScriptResponse {
  success: boolean;
  error?: string;
}

export const useNutritionExtractor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NutritionData | null>(null);
  const [previewData, setPreviewData] = useState<NutritionPreview | null>(null);
  
  // Tải dữ liệu từ chrome.storage khi component được mount
  useEffect(() => {
    chrome.storage.local.get(['nutritionPreview'], (result) => {
      if (result.nutritionPreview) {
        setPreviewData(result.nutritionPreview);
        setData(result.nutritionPreview.data);
        console.log('Loaded nutrition preview:', result.nutritionPreview);
      }
    });
  }, []);

  const extractNutrition = useCallback(async (): Promise<NutritionData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Lấy tab hiện tại
      const tabs = await new Promise<chrome.tabs.Tab[]>(resolve => {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => resolve(tabs));
      });
      
      if (!tabs || tabs.length === 0 || !tabs[0].id) {
        throw new Error('Không thể xác định tab hiện tại');
      }
      
      const tab = tabs[0];
      const tabUrl = tab.url;
      
      // Kiểm tra xem URL có hợp lệ không
      if (!tabUrl || !tabUrl.startsWith('http')) {
        throw new Error('URL trang hiện tại không hợp lệ hoặc không được hỗ trợ');
      }
      
      // Đảm bảo register tab trong background trước khi làm bất cứ điều gì
      await new Promise<void>((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'registerTabAsInjected', tabId: tab.id },
          (response) => {
            if (chrome.runtime.lastError) {
              console.warn('Lỗi register tab:', chrome.runtime.lastError.message);
              // Vẫn tiếp tục dù có lỗi
              resolve();
              return;
            }
            console.log('Đã register tab với background:', response);
            resolve();
          }
        );
      });
      
      // Đợi một chút để đảm bảo background đã cập nhật
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Inject content script để đảm bảo nó đã được tải
      console.log('Force inject content script để đảm bảo hoạt động...');
      
      // Đợi chút thời gian để tránh xung đột message
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 300);
      });
      
      // Inject content script với force=true
      const injectResponse = await new Promise<InjectContentScriptResponse>((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'injectContentScript', tabId: tab.id, force: true },
          (response) => {
            if (chrome.runtime.lastError) {
              console.warn('Lỗi kết nối:', chrome.runtime.lastError.message);
              resolve({ success: false, error: chrome.runtime.lastError.message });
              return;
            }
            console.log('Inject response:', response);
            resolve(response || { success: false, error: 'Không nhận được phản hồi' });
          }
        );
      });
      
      console.log('Kết quả inject:', injectResponse);
      
      // Đợi thêm thời gian để content script khởi động
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Trích xuất dữ liệu sử dụng retry logic
      let response: ExtractNutritionResponse | null = null;
      let retries = 0;
      const maxRetries = 3;
      
      // Vòng lặp retry
      while (retries < maxRetries) {
        try {
          console.log(`Đang gửi yêu cầu trích xuất, lần thử ${retries + 1}/${maxRetries}...`);
          
          // Gọi trích xuất qua background proxy
          response = await new Promise<ExtractNutritionResponse>((resolve, reject) => {
            const messageTimeout = setTimeout(() => {
              reject(new Error('Hết thời gian chờ phản hồi từ background/content script'));
            }, 15000);
            
            try {
              console.log('Gọi proxy qua background để trích xuất dữ liệu...');
              
              chrome.runtime.sendMessage(
                { 
                  action: 'proxy_to_content_script', 
                  tabId: tab.id,
                  proxyRequest: { action: "extractNutrition" }
                },
                (response) => {
                  clearTimeout(messageTimeout);
                  
                  if (chrome.runtime.lastError) {
                    console.warn('Lỗi kết nối với background script:', chrome.runtime.lastError.message);
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                  }
                  
                  console.log('Nhận được phản hồi qua proxy:', response);
                  
                  if (!response || !response.success) {
                    reject(new Error(response?.error || 'Lỗi không xác định từ background'));
                    return;
                  }
                  
                  // Phản hồi thành công từ background, lấy dữ liệu từ content script
                  resolve(response.data || { success: false, error: 'Không có dữ liệu phản hồi từ content script' });
                }
              );
            } catch (err) {
              clearTimeout(messageTimeout);
              reject(err);
            }
          });
          
          // Nhận được phản hồi thành công, thoát khỏi vòng lặp
          console.log('Nhận được phản hồi, tiếp tục xử lý...');
          break;
          
        } catch (err: any) {
          console.warn(`Lần thử ${retries + 1}/${maxRetries} thất bại:`, err?.message || err);
          retries++;
          
          if (retries < maxRetries) {
            // Đợi trước khi thử lại
            const waitTime = 800;
            console.log(`Thử lại sau ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Yêu cầu inject lại content script
            console.log('Yêu cầu inject lại content script...');
            await new Promise<void>(resolve => {
              chrome.runtime.sendMessage(
                { action: 'injectContentScript', tabId: tab.id, force: true },
                () => setTimeout(resolve, 500)
              );
            });
          } else {
            throw new Error(`Không thể kết nối với content script sau ${maxRetries} lần thử. Hãy tải lại trang và thử lại.`);
          }
        }
      }
      
      console.log('Nhận được response cuối cùng:', response);

      if (!response || !response.success || !response.data) {
        throw new Error('Không thể trích xuất dữ liệu dinh dưỡng');
      }

      // Lưu dữ liệu vào state của component
      setData(response.data);
      
      // Đảm bảo rằng dữ liệu preview được cập nhật - kiểm tra và chờ tới khi có dữ liệu
      // Thêm một khoảng thời gian chờ để content script có thể lưu dữ liệu vào storage trước
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Tải lại dữ liệu bôi vàng từ storage
      await new Promise<void>((resolve) => {
        chrome.storage.local.get(['nutritionPreview'], (result) => {
          if (result.nutritionPreview) {
            setPreviewData(result.nutritionPreview);
            console.log('Updated nutrition preview:', result.nutritionPreview);
          } else {
            // Nếu không có dữ liệu từ storage, tự tạo một dữ liệu preview
            console.log('Tự tạo dữ liệu preview vì không tìm thấy trong storage');
            // Tạo dữ liệu preview tối thiểu 
            // Đảm bảo response.data không phải undefined vì chúng ta đã kiểm tra ở trên
            // TypeScript không biết điều này nên phải dùng as để khẳng định
            const minimalPreview = {
              url: tabUrl,
              title: document.title || tabUrl,
              timestamp: new Date().toISOString(),
              data: response.data as NutritionData, // Đảm bảo TypeScript hiểu rằng dữ liệu luôn tồn tại
              sourceInfo: {}
            };
            setPreviewData(minimalPreview);
            
            // Lưu vào storage để sử dụng sau này
            chrome.storage.local.set({ 'nutritionPreview': minimalPreview }, () => {
              console.log('Saved minimal nutrition preview to Chrome storage');
            });
          }
          resolve();
        });
      });
      
      // Lưu trữ dữ liệu đã trích xuất và trả về
      return response.data;
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật UI cho nút extraction với xử lý thông báo
  const handleExtraction = async () => {
    try {
      await extractNutrition();
      showSuccessNotification();
      return true;
    } catch (err) {
      if (err instanceof Error) {
        showErrorNotification(err.message);
      } else {
        showErrorNotification('Có lỗi xảy ra trong quá trình trích xuất');
      }
      return false;
    }
  };

  return {
    loading,
    error,
    data,
    previewData,
    extractNutrition,
    handleExtraction
  };
};
