import { useState } from 'react';
import { isTrustedSource } from '../utils/urlUtils';
import { getXPathConfigForUrl, createXPathExtractionScript } from '../utils/xpathUtils';
import { createAndWaitForTab, executeScriptInTab, closeTab } from '../utils/tabService';
import { logger } from '../store/logStore';
import type { ExcelRow } from '../types';

/**
 * Custom hook để xử lý URL và trích xuất dữ liệu
 * @returns Các hàm và state liên quan đến xử lý URL
 */
export function useUrlProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Xử lý một URL và trích xuất dữ liệu theo cấu hình XPath
   * @param url URL cần xử lý
   * @param onlyTrustedSources Chỉ xử lý nguồn tin cậy
   * @returns Kết quả xử lý URL
   */
  const processUrl = async (
    url: string,
    onlyTrustedSources: boolean = false
  ): Promise<{success: boolean, data: Record<string, string | null>, isTrusted?: boolean}> => {
    // Kiểm tra URL có thuộc nguồn tin cậy không
    const trusted = isTrustedSource(url);
    
    // Nếu chỉ xử lý nguồn tin cậy và URL không phải nguồn tin cậy, bỏ qua
    if (onlyTrustedSources && !trusted) {
      return { success: false, data: {}, isTrusted: false };
    }

    let tab: chrome.tabs.Tab | null = null;

    try {
      // Tạo tab mới và đợi nó load xong
      tab = await createAndWaitForTab(url);
      
      // Lấy cấu hình XPath cho URL
      const xpathConfig = getXPathConfigForUrl(url);
      
      // Inject script để xử lý XPath với retry
      let result = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          console.log(`Executing script attempt ${retryCount + 1}`);
          // Thực thi script trích xuất XPath
          const extractionScript = createXPathExtractionScript();
          const scriptResults = await executeScriptInTab(tab.id!, extractionScript, xpathConfig);
          
          // Kiểm tra kết quả
          const hasResults = Object.values(scriptResults).some(val => val !== null);
          
          if (hasResults) {
            result = scriptResults;
            break;
          }
          
          // Nếu không tìm thấy gì, thử lại
          retryCount++;
          // Đợi thêm giữa các lần thử
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          logger.error(`Lỗi lần thử ${retryCount + 1}:`, e);
          retryCount++;
          // Đợi thêm giữa các lần thử
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Đóng tab sau khi hoàn thành
      if (tab && tab.id) {
        await closeTab(tab.id);
      }
      
      // Xử lý kết quả
      if (result) {
        return {
          success: true,
          data: result,
          isTrusted: trusted
        };
      } else {
        logger.error(`Không thể trích xuất dữ liệu sau ${maxRetries} lần thử:`, { url });
        return {
          success: false,
          data: {},
          isTrusted: trusted
        };
      }
    } catch (error) {
      logger.error(`Lỗi xử lý URL: ${url}`, error);
      
      // Đóng tab nếu có lỗi
      if (tab && tab.id) {
        await closeTab(tab.id);
      }
      
      return {
        success: false,
        data: {},
        isTrusted: trusted
      };
    }
  };

  /**
   * Xử lý batch các URL từ dữ liệu Excel
   * @param excelData Dữ liệu Excel cần xử lý
   * @param onlyTrustedSources Chỉ xử lý nguồn tin cậy
   * @param onProgress Callback cập nhật tiến trình
   * @returns Dữ liệu đã xử lý
   */
  const processBatch = async (
    excelData: ExcelRow[],
    onlyTrustedSources: boolean,
    onProgress?: (processed: number, total: number) => void
  ): Promise<ExcelRow[]> => {
    if (excelData.length === 0) {
      setError('Không có dữ liệu Excel để xử lý');
      return [];
    }

    setIsProcessing(true);
    setError(null);
    
    const processedData: ExcelRow[] = [];
    
    try {
      // Xử lý tuần tự từng URL
      for (let i = 0; i < excelData.length; i++) {
        const row = { ...excelData[i] };
        const url = row.url;
        
        // Cập nhật trạng thái hàng hiện tại
        row.status = 'processing';
        processedData[i] = row;
        
        // Thông báo tiến độ
        if (onProgress) {
          onProgress(i, excelData.length);
        }
        
        try {
          // Bỏ qua URL không phải nguồn tin cậy nếu cần
          if (onlyTrustedSources && !isTrustedSource(url)) {
            row.status = 'failed';
            row.error = 'URL không thuộc nguồn tin cậy';
            processedData[i] = row;
            continue;
          }
          
          // Xử lý URL
          const result = await processUrl(url, onlyTrustedSources);
          
          if (result.success) {
            // Cập nhật dữ liệu trích xuất
            row.extractedData = { ...row.extractedData };
            Object.entries(result.data).forEach(([field, value]) => {
              row.extractedData[field] = value;
            });
            row.status = 'completed';
          } else {
            row.status = 'failed';
            row.error = 'Không thể trích xuất dữ liệu';
          }
        } catch (error) {
          logger.error(`Lỗi xử lý hàng ${i}:`, error);
          row.status = 'failed';
          row.error = error instanceof Error ? error.message : 'Lỗi không xác định';
        }
        
        // Cập nhật dữ liệu đã xử lý
        processedData[i] = row;
      }
      
      return processedData;
    } catch (error) {
      setError('Lỗi xử lý batch: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'));
      return processedData;
    } finally {
      setIsProcessing(false);
      // Thông báo tiến độ hoàn thành
      if (onProgress) {
        onProgress(excelData.length, excelData.length);
      }
    }
  };

  return {
    isProcessing,
    error,
    processUrl,
    processBatch
  };
}
