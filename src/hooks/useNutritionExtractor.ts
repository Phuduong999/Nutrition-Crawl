import { useState, useEffect } from 'react';
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

  const extractNutrition = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Getting current tab...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error('Không tìm thấy tab đang mở');
      }
      
      // Yêu cầu background script inject content script khi người dùng nhấn nút
      console.log('Yêu cầu inject content script...');
      
      // Kiểm tra content script trước khi gọi
      // Nếu content script chưa được tải, thử inject
      const injectResponse = await new Promise<InjectContentScriptResponse>((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'injectContentScript', tabId: tab.id },
          (response) => {
            // Kiểm tra lỗi kết nối
            if (chrome.runtime.lastError) {
              console.warn('Lỗi kết nối:', chrome.runtime.lastError.message);
              resolve({ success: false, error: chrome.runtime.lastError.message });
              return;
            }
            resolve(response || { success: false, error: 'Không nhận được phản hồi' });
          }
        );
      });
      
      console.log('Kết quả inject:', injectResponse);
      
      // Nếu không inject được content script, báo lỗi
      if (!injectResponse || !injectResponse.success) {
        const errMsg = injectResponse?.error || 'Không thể inject content script';
        throw new Error(errMsg);
      }

      console.log('Sending message to content script...');
      
      // Thêm retry logic khi gọi content script
      let retries = 0;
      const maxRetries = 3;
      let response = null;
      
      while (retries < maxRetries) {
        try {
          response = await new Promise<ExtractNutritionResponse>((resolve, reject) => {
            chrome.tabs.sendMessage(tab.id!, { action: 'extractNutrition' }, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              resolve(result);
            });
            
            // Đặt timeout để tránh chờ vô hạn
            setTimeout(() => {
              reject(new Error('Kết nối với content script hết hạn'));
            }, 3000);
          });
          
          // Nếu kết nối thành công, thoát khỏi vòng lặp
          break;
        } catch (err) {
          console.warn(`Lần thử ${retries + 1}/${maxRetries} thất bại:`, err);
          retries++;
          
          // Thử inject lại content script nếu lỗi kết nối
          if (retries < maxRetries) {
            console.log('Thử lại sau 500ms...');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Yêu cầu inject lại
            await new Promise<void>(resolve => {
              chrome.runtime.sendMessage(
                { action: 'injectContentScript', tabId: tab.id },
                () => resolve()
              );
            });
          } else {
            throw new Error('Không thể kết nối với content script sau nhiều lần thử. Hãy tải lại trang.');
          }
        }
      }
      
      console.log('Received response:', response);

      if (!response?.success || !response?.data) {
        throw new Error('Failed to extract nutrition data');
      }

      setData(response.data as NutritionData);

      // Tải lại dữ liệu bôi vàng từ storage
      chrome.storage.local.get(['nutritionPreview'], (result) => {
        if (result.nutritionPreview) {
          setPreviewData(result.nutritionPreview);
          console.log('Updated nutrition preview:', result.nutritionPreview);
        }
      });

      // Create and download JSON file
      const json = JSON.stringify(response.data as NutritionData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const domain = new URL(tab.url || '').hostname.replace('www.', '');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `nutrition-${domain}-${timestamp}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

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
