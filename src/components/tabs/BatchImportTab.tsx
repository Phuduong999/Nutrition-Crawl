import React, { useState, useEffect } from 'react';
import { Card, Stepper, Button, Group, Text, Alert, Checkbox, Stack } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconDownload, IconRobot, IconShieldCheck } from '@tabler/icons-react';
import ExcelUploader from '../excel/ExcelUploader';
import BatchProcessingTable from '../excel/BatchProcessingTable';
import BatchPreview from '../excel/BatchPreview';
import type { ExcelRow } from '../../types';
import { utils, write } from 'xlsx';
import { defaultXPathMappings, nutritionixXPathMappings, eatThisMuchXPathMappings } from '../../config/xpathMapping';
import { trustedSources } from '../../config/trustedSources';
import { useChromeStorage } from '../../hooks/useChromeStorage';
import { logger } from '../../store/logStore';

interface BatchImportTabProps {
  setActiveTab?: (value: string | null) => void;
}

const BatchImportTab: React.FC<BatchImportTabProps> = () => {
  // Sử dụng chrome.storage để lưu trạng thái giữa các lần chuyển tab
  const { storedValue: storedActiveStep, setValue: setStoredActiveStep, isLoading: isLoadingActiveStep } = 
    useChromeStorage<number>('batchImport_activeStep', 0);
  
  const { storedValue: storedExcelData, setValue: setStoredExcelData, isLoading: isLoadingExcelData } = 
    useChromeStorage<ExcelRow[]>('batchImport_excelData', []);
  
  const { storedValue: storedProcessedData, setValue: setStoredProcessedData, isLoading: isLoadingProcessedData } = 
    useChromeStorage<ExcelRow[]>('batchImport_processedData', []);
  
  const { storedValue: storedIsProcessing, setValue: setStoredIsProcessing } = 
    useChromeStorage<boolean>('batchImport_isProcessing', false);
  
  const { storedValue: storedOnlyTrustedSources, setValue: setStoredOnlyTrustedSources } = 
    useChromeStorage<boolean>('batchImport_onlyTrustedSources', true);
    
  // State locals để tối ưu hiệu suất
  const [activeStep, setActiveStep] = useState(0);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [processedData, setProcessedData] = useState<ExcelRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlyTrustedSources, setOnlyTrustedSources] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Đồng bộ state từ chrome.storage khi component được mount
  useEffect(() => {
    if (!isLoadingActiveStep && !isLoadingExcelData && !isLoadingProcessedData) {
      setActiveStep(storedActiveStep);
      setExcelData(storedExcelData);
      setProcessedData(storedProcessedData);
      setIsProcessing(storedIsProcessing);
      setOnlyTrustedSources(storedOnlyTrustedSources);
      setIsLoading(false);
      console.log('State loaded from storage:', {
        activeStep: storedActiveStep,
        excelDataCount: storedExcelData.length,
        processedDataCount: storedProcessedData.length,
        isProcessing: storedIsProcessing
      });
    }
  }, [isLoadingActiveStep, isLoadingExcelData, isLoadingProcessedData, 
     storedActiveStep, storedExcelData, storedProcessedData, storedIsProcessing, storedOnlyTrustedSources]);
  
  // Cập nhật chrome.storage khi state thay đổi
  useEffect(() => {
    if (!isLoading) {
      setStoredActiveStep(activeStep);
    }
  }, [activeStep, isLoading, setStoredActiveStep]);
  
  useEffect(() => {
    if (!isLoading && excelData.length > 0) {
      setStoredExcelData(excelData);
    }
  }, [excelData, isLoading, setStoredExcelData]);
  
  useEffect(() => {
    if (!isLoading && processedData.length > 0) {
      setStoredProcessedData(processedData);
    }
  }, [processedData, isLoading, setStoredProcessedData]);
  
  useEffect(() => {
    if (!isLoading) {
      setStoredIsProcessing(isProcessing);
    }
  }, [isProcessing, isLoading, setStoredIsProcessing]);
  
  useEffect(() => {
    if (!isLoading) {
      setStoredOnlyTrustedSources(onlyTrustedSources);
    }
  }, [onlyTrustedSources, isLoading, setStoredOnlyTrustedSources]);

  const handleFileUpload = (rows: ExcelRow[]) => {
    if (rows.length === 0) {
      setError('Không tìm thấy URL nào từ file Excel. Hãy đảm bảo file có cột "trusted source" chứa các URL cần xử lý.');
      return;
    }
    
    setExcelData(rows);
    setError(null);
    setActiveStep(1);
  };

  // Kiểm tra URL có thuộc nguồn tin cậy không
  const isTrustedSource = (url: string): boolean => {
    try {
      const hostname = new URL(url).hostname;
      const isTrusted = Object.keys(trustedSources).some(domain => hostname.includes(domain));
      
      // Log kết quả kiểm tra source
      logger.url(`Kiểm tra nguồn tin cậy: ${url}`, {
        hostname,
        isTrusted,
        availableTrustedDomains: Object.keys(trustedSources)
      });
      
      return isTrusted;
    } catch (error) {
      logger.error(`Lỗi khi kiểm tra URL: ${url}`, error);
      return false;
    }
  };

  const processUrl = async (url: string): Promise<{success: boolean, data: Record<string, string | null>, isTrusted?: boolean}> => {
    // Kiểm tra URL có thuộc nguồn tin cậy không
    const trusted = isTrustedSource(url);
    
    // Nếu chỉ xử lý nguồn tin cậy và URL không phải nguồn tin cậy, bỏ qua
    if (onlyTrustedSources && !trusted) {
      return { success: false, data: {}, isTrusted: false };
    }

    let tab: chrome.tabs.Tab | null = null;

    try {
      // Log bắt đầu xử lý URL
      logger.url(`Bắt đầu xử lý URL: ${url}`, {
        trusted,
        timestamp: new Date().toISOString()
      });
      
      // Sử dụng chromium API để mở tab mới
      tab = await chrome.tabs.create({ url, active: false });
      logger.url(`Đã tạo tab với ID: ${tab.id}`, { tabId: tab.id });
      
      // Đợi trang tải xong (thêm timeout 10 giây)
      await new Promise((resolve, reject) => {
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
            setTimeout(resolve, 2000);
          }
        };

        chrome.tabs.onUpdated.addListener(listener);
      });
      
      logger.url(`Tab đã sẵn sàng, chuẩn bị thực thi script: ${url}`);

      // Thử xem site cụ thể để lấy XPath phù hợp
      let xpathConfig: typeof defaultXPathMappings = [];
      try {
        const hostname = new URL(url).hostname;
        const domain = Object.keys(trustedSources).find(d => hostname.includes(d));
        
        if (domain && trustedSources[domain]) {
          // Sử dụng XPath cụ thể cho site này
          logger.url(`Sử dụng XPath cụ thể cho domain: ${domain}`, { hostname, domain });
          
          if (domain === 'nutritionix.com') {
            // Sử dụng cấu hình XPath riêng cho nutritionix.com
            xpathConfig = [...nutritionixXPathMappings];
            logger.url(`Áp dụng ${xpathConfig.length} XPath cho Nutritionix`, {
              sample: xpathConfig.slice(0, 3).map(x => ({ field: x.field, xpath: x.xpath }))
            });
          } else if (domain === 'eatthismuch.com') {
            // Sử dụng cấu hình XPath riêng cho eatthismuch.com
            xpathConfig = [...eatThisMuchXPathMappings];
            logger.url(`Áp dụng ${xpathConfig.length} XPath cho EatThisMuch`, {
              sample: xpathConfig.slice(0, 3).map(x => ({ field: x.field, xpath: x.xpath }))
            });
          } else {
            // Mặc định cho các domain khác
            xpathConfig = [...defaultXPathMappings];
            logger.url(`Sử dụng XPath mặc định cho domain: ${domain}`, {
              sample: xpathConfig.slice(0, 3).map(x => ({ field: x.field, xpath: x.xpath }))
            });
          }
        } else {
          // Sử dụng cấu hình mặc định cho domain không được nhận diện
          xpathConfig = [...defaultXPathMappings];
          logger.url(`Domain không được nhận diện, sử dụng XPath mặc định: ${hostname}`);
        }
      } catch (e) {
        logger.error('Lỗi khi xác định XPath cho site:', e);
        // Sử dụng cấu hình mặc định
        xpathConfig = [...defaultXPathMappings];
      }
      
      // Inject script để xử lý XPath với retry
      let result = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          console.log(`Executing script attempt ${retryCount + 1}`);
          const scriptResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            func: (mappings) => {
              console.log('Starting XPath extraction with mappings:', mappings);
              const results: Record<string, string | null> = {};
              
              for (const mapping of mappings) {
                try {
                  const xpath = mapping.xpath;
                  const field = mapping.field;
                  
                  console.log(`Processing XPath: ${xpath} for field: ${field}`);
                  
                  // Thử nhiều cách để tìm dữ liệu
                  let found = false;
                  
                  // Cách 1: Thử dùng XPath trực tiếp
                  try {
                    const elements = document.evaluate(
                      xpath, 
                      document, 
                      null, 
                      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
                      null
                    );
                    
                    if (elements.snapshotLength > 0) {
                      const element = elements.snapshotItem(0) as HTMLElement;
                      let rawValue = element.textContent?.trim() || null;
                      
                      // Xử lý làm sạch giá trị được trích xuất
                      if (rawValue) {
                        // Tách số và đơn vị
                        const valueMatch = rawValue.match(/([\d\.]+)\s*([a-zA-Z%]*)/);
                        if (valueMatch) {
                          // Chỉ lấy giá trị số và đơn vị
                          rawValue = valueMatch[0].trim();
                        }
                      }
                      
                      results[field] = rawValue;
                      found = true;
                      
                      // Log chi tiết kết quả XPath extraction
                      try {
                        // Dùng chrome.runtime.sendMessage để gửi dữ liệu extraction về background
                        chrome.runtime.sendMessage({
                          action: 'log_xpath_extraction',
                          data: {
                            type: 'xpath',
                            url: window.location.href,
                            field: field,
                            description: mapping.description,
                            xpath: mapping.xpath,
                            value: results[field],
                            rawTextContent: element.textContent,
                            cleanedValue: results[field],
                            element: {
                              tagName: element.tagName,
                              textContent: element.textContent,
                              innerHTML: element.innerHTML.length > 200 ? 
                                element.innerHTML.substring(0, 200) + '...' : 
                                element.innerHTML,
                              attributes: Array.from(element.attributes).map(attr => ({ 
                                name: attr.name, 
                                value: attr.value 
                              })),
                            }
                          }
                        });
                      } catch (logError) {
                        console.error('Failed to log XPath extraction:', logError);
                      }
                      
                      console.log(`Found value for ${field}:`, results[field]);
                    }
                  } catch (e) {
                    console.log(`XPath execution failed for ${field}:`, e);
                  }
                  
                  // Cách 2: Tìm theo text trong trang
                  if (!found) {
                    // Thử tìm theo description/title
                    const searchText = mapping.description || field.replace('column', '');
                    const allElements = document.querySelectorAll('*');
                    
                    for (let i = 0; i < allElements.length; i++) {
                      const el = allElements[i] as HTMLElement;
                      if (el.textContent && el.textContent.toLowerCase().includes(searchText.toLowerCase())) {
                        // Tìm phần tử gần đó có thể chứa giá trị
                        const nextSibling = el.nextElementSibling as HTMLElement;
                        if (nextSibling && nextSibling.textContent) {
                          results[field] = nextSibling.textContent.trim() || null;
                          found = true;
                          
                          // Log chi tiết text search extraction
                          try {
                            chrome.runtime.sendMessage({
                              action: 'log_xpath_extraction',
                              data: {
                                type: 'text_search',
                                url: window.location.href,
                                field: field,
                                description: mapping.description,
                                searchText: searchText,
                                value: results[field],
                                element: {
                                  matchingElement: {
                                    tagName: el.tagName,
                                    textContent: el.textContent
                                  },
                                  valueElement: {
                                    tagName: nextSibling.tagName,
                                    textContent: nextSibling.textContent,
                                    innerHTML: nextSibling.innerHTML.length > 200 ?
                                      nextSibling.innerHTML.substring(0, 200) + '...' :
                                      nextSibling.innerHTML
                                  }
                                }
                              }
                            });
                          } catch (logError) {
                            console.error('Failed to log text search extraction:', logError);
                          }
                          
                          console.log(`Found value by text for ${field}:`, results[field]);
                          break;
                        }
                      }
                    }
                  }
                  
                  if (!found) {
                    results[field] = null;
                    
                    // Log thất bại trong việc trích xuất
                    try {
                      chrome.runtime.sendMessage({
                        action: 'log_xpath_extraction',
                        data: {
                          type: 'extraction_failed',
                          url: window.location.href,
                          field: field,
                          description: mapping.description,
                          xpath: mapping.xpath,
                          value: null,
                          reason: 'No matching element found'
                        }
                      });
                    } catch (logError) {
                      console.error('Failed to log failed extraction:', logError);
                    }
                    
                    console.log(`No value found for ${field}`);
                  }
                } catch (e) {
                  console.error(`Error processing field ${mapping.field}:`, e);
                  results[mapping.field] = null;
                }
              }
              
              // Log tổng hợp kết quả
              try {
                chrome.runtime.sendMessage({
                  action: 'log_extraction_summary',
                  data: {
                    type: 'extraction_summary',
                    url: window.location.href,
                    domain: window.location.hostname,
                    timestamp: new Date().toISOString(),
                    results: results,
                    successCount: Object.values(results).filter(v => v !== null).length,
                    totalFields: Object.keys(results).length
                  }
                });
              } catch (logError) {
                console.error('Failed to log extraction summary:', logError);
              }
              
              console.log('Final extraction results:', results);
              return results;
            },
            args: [xpathConfig]
          });
          
          result = scriptResults[0];
          console.log('Script execution result:', result);
          
          // Kiểm tra xem có dữ liệu không
          const hasData = result && result.result && Object.values(result.result).some(v => v !== null);
          if (hasData) {
            console.log('Successfully extracted data');
            break; // Thành công, thoát vòng lặp
          }
          
          // Không có dữ liệu, thử lại
          retryCount++;
          console.log(`No data found, retrying (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Đợi 2 giây trước khi thử lại
        } catch (e) {
          console.error('Script execution error:', e);
          retryCount++;
          if (retryCount >= maxRetries) break;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Đóng tab sau khi xử lý xong (chờ 1 giây trước khi đóng)
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (tab && tab.id) {
        try {
          await chrome.tabs.remove(tab.id);
          console.log('Tab closed successfully');
        } catch (e) {
          console.error('Error closing tab:', e);
        }
      }
      
      if (!result || !result.result) {
        console.error('No result data after all retries');
        return { success: false, data: {}, isTrusted: trusted };
      }
      
      return { success: true, data: result.result, isTrusted: true };
    } catch (error) {
      console.error('Error processing URL:', url, error);
      
      // Đảm bảo đóng tab nếu có lỗi
      if (tab && tab.id) {
        try {
          await chrome.tabs.remove(tab.id);
          console.log('Tab closed after error');
        } catch (e) {
          console.error('Error closing tab after error:', e);
        }
      }
      
      return { success: false, data: {}, isTrusted: trusted };
    }
  };

  const handleStartProcessing = async () => {
    setIsProcessing(true);
    setError(null);
    
    // Tạo bản sao của dữ liệu Excel để cập nhật trạng thái
    const updatedData = [...excelData];
    
    // Xử lý tuần tự từng URL
    for (let i = 0; i < updatedData.length; i++) {
      try {
        // Cập nhật trạng thái đang xử lý
        updatedData[i].status = 'processing';
        setExcelData([...updatedData]);
        
        // Xử lý URL
        const { success, data, isTrusted } = await processUrl(updatedData[i].url);
        
        // Cập nhật kết quả
        if (!isTrusted && onlyTrustedSources) {
          updatedData[i].status = 'failed';
          updatedData[i].error = 'URL không thuộc nguồn tin cậy (nutritionix.com, eatthismuch.com)';
        } else if (success) {
          // Đảm bảo dữ liệu có cấu trúc đúng
          const extractedData = {
            columnK: null,
            columnL: null,
            columnM: null,
            columnN: null,
            columnO: null,
            columnP: null,
            columnQ: null,
            columnR: null,
            columnS: null,
            columnT: null,
            ...data
          };
          updatedData[i].extractedData = extractedData;
          updatedData[i].status = 'completed';
        } else {
          updatedData[i].status = 'failed';
          updatedData[i].error = 'Không thể trích xuất dữ liệu từ URL này';
        }
      } catch (error) {
        // Xử lý lỗi
        updatedData[i].status = 'failed';
        updatedData[i].error = 'Có lỗi xảy ra khi xử lý URL này';
      }
      
      // Cập nhật giao diện
      setExcelData([...updatedData]);
    }
    
    setIsProcessing(false);
    setProcessedData([...updatedData]);
    setActiveStep(2);
  };

  const handleDownload = () => {
    try {
      // Tạo workbook mới
      const wb = utils.book_new();
      
      // Chuyển đổi dữ liệu từ processedData sang định dạng phù hợp cho Excel
      const excelRows = processedData.map((row) => {
        const excelRow: Record<string, any> = {
          'trusted source': row.url,
        };
        
        // Thêm dữ liệu trích xuất vào các cột tương ứng K-T
        defaultXPathMappings.forEach((mapping) => {
          const columnLetter = String.fromCharCode(65 + mapping.columnIndex); // Chuyển columnIndex thành chữ cái
          excelRow[columnLetter] = row.extractedData[mapping.field] || '';
        });
        
        return excelRow;
      });
      
      // Tạo worksheet
      const ws = utils.json_to_sheet(excelRows);
      
      // Thêm worksheet vào workbook
      utils.book_append_sheet(wb, ws, 'Data');
      
      // Ghi workbook vào file
      const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Tạo blob và download
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutrition_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      
      // Giải phóng URL
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      setError('Có lỗi xảy ra khi tạo file Excel. Vui lòng thử lại.');
    }
  };

  // Hiển thị màn hình loading khi đang lấy dữ liệu từ storage
  if (isLoading) {
    return (
      <Card withBorder p="md" radius="md">
        <Text ta="center" py="xl">
          Đang tải dữ liệu...
        </Text>
      </Card>
    );
  }

  return (
    <Card withBorder p="md" radius="md">
      {error && (
        <Alert 
          icon={<IconAlertCircle size="1rem" />} 
          title="Lỗi" 
          color="red" 
          mb="md"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      <Stepper active={activeStep} onStepClick={setActiveStep} mb="xl" size="sm">
        <Stepper.Step 
          label="Tải file Excel" 
          description="Upload file Excel chứa danh sách URL"
          icon={<IconDownload size="1rem" />}
        >
          <Text fw={500} mb="md">Tải lên file Excel</Text>
          <Text size="sm" mb="md" c="dimmed">
            File Excel phải có cột "trusted source" (cột F) chứa các URL cần trích xuất dữ liệu.
          </Text>
          <ExcelUploader onUpload={handleFileUpload} isLoading={isProcessing} />
        </Stepper.Step>

        <Stepper.Step 
          label="Trích xuất dữ liệu" 
          description="Tự động xử lý các URL"
          icon={<IconRobot size="1rem" />}
        >
          <Text fw={500} mb="md">Danh sách URL để trích xuất</Text>
          <BatchProcessingTable 
            data={excelData} 
            isProcessing={isProcessing}
          />
          
          <Stack mt="md">
            <Checkbox
              checked={onlyTrustedSources}
              onChange={(event) => setOnlyTrustedSources(event.currentTarget.checked)}
              label="Chỉ xử lý URL từ nguồn tin cậy (nutritionix.com, eatthismuch.com)"
              icon={IconShieldCheck}
              styles={{ label: { fontWeight: 500 } }}
            />
            
            {!onlyTrustedSources && (
              <Alert 
                color="yellow" 
                icon={<IconAlertCircle size="1rem" />}
                title="Cảnh báo về nguồn không tin cậy"
                withCloseButton={false}
              >
                Chỉ các URL từ nguồn tin cậy mới có thể trích xuất dữ liệu chính xác.
                Kết quả từ các nguồn khác có thể không chính xác hoặc không đầy đủ.
              </Alert>
            )}
          </Stack>
          
          <Group justify="center" mt="xl">
            <Button 
              onClick={handleStartProcessing} 
              loading={isProcessing}
              disabled={excelData.length === 0}
              color="teal"
            >
              {isProcessing ? 'Đang xử lý...' : 'Bắt đầu trích xuất dữ liệu'}
            </Button>
          </Group>
        </Stepper.Step>

        <Stepper.Step 
          label="Kết quả" 
          description="Xem và tải xuống kết quả"
          icon={<IconCheck size="1rem" />}
        >
          <Text fw={500} mb="md">Kết quả trích xuất dữ liệu</Text>
          <BatchPreview data={processedData} />
          <Group justify="center" mt="xl">
            <Button 
              onClick={handleDownload} 
              disabled={processedData.length === 0}
              color="teal"
              leftSection={<IconDownload size="1rem" />}
            >
              Tải xuống file Excel
            </Button>
          </Group>
        </Stepper.Step>
      </Stepper>
    </Card>
  );
};

export default BatchImportTab;
