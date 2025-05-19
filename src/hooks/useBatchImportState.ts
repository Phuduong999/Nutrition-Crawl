import { useState, useEffect } from 'react';
import { useChromeStorage } from './useChromeStorage';
import type { ExcelRow } from '../types';

/**
 * Custom hook quản lý state cho chức năng Batch Import
 * Giúp đồng bộ state với chrome.storage và tránh re-render không cần thiết
 */
export function useBatchImportState() {
  // State được lưu vào chrome.storage
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

  // Các hàm xử lý
  const handleFileUpload = (rows: ExcelRow[]) => {
    if (rows.length === 0) {
      setError('Không tìm thấy URL nào từ file Excel. Hãy đảm bảo file có cột "trusted source" chứa các URL cần xử lý.');
      return;
    }
    
    setExcelData(rows);
    setError(null);
    setActiveStep(1);
  };

  // Reset state
  const resetState = () => {
    setActiveStep(0);
    setExcelData([]);
    setProcessedData([]);
    setIsProcessing(false);
    setError(null);
  };

  return {
    // State
    activeStep,
    setActiveStep,
    excelData,
    setExcelData,
    processedData, 
    setProcessedData,
    isProcessing,
    setIsProcessing,
    error,
    setError,
    onlyTrustedSources,
    setOnlyTrustedSources,
    isLoading,
    
    // Actions
    handleFileUpload,
    resetState
  };
}
