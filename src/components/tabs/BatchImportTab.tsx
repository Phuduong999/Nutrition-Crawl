import React from 'react';
import { useBatchImportState } from '../../hooks/useBatchImportState';
import { useUrlProcessor } from '../../hooks/useUrlProcessor';
import BatchImportStepper from '../batch/BatchImportStepper';
import { logger } from '../../store/logStore';

interface BatchImportTabProps {
  setActiveTab?: (value: string | null) => void;
}

const BatchImportTab: React.FC<BatchImportTabProps> = () => {
  // Use our custom hooks
  const {
    activeStep, setActiveStep,
    excelData,
    processedData, setProcessedData,
    isProcessing,
    error, setError,
    onlyTrustedSources, setOnlyTrustedSources,
    handleFileUpload, resetState
  } = useBatchImportState();
  
  const { processBatch } = useUrlProcessor();
  
  // Start processing function
  const handleStartProcessing = async () => {
    if (excelData.length === 0) {
      setError('Không có dữ liệu Excel để xử lý');
      return;
    }

    setError(null);
    
    try {
      // Đánh dấu tất cả dòng là 'pending' trước khi xử lý
      const initialProcessedData = excelData.map(row => ({
        ...row,
        status: 'pending' as const
      }));
      setProcessedData(initialProcessedData);
      
      // Process batch with progress callback
      const result = await processBatch(
        excelData,
        onlyTrustedSources,
        (processed, total) => {
          logger.url(`Progress: ${processed}/${total}`);
        }
      );
      
      setProcessedData(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Batch processing error: ${errorMessage}`);
    }
  };
  
  // Handle reset - go back to step 1
  const handleReset = () => {
    resetState();
  };
  
  return (
    <BatchImportStepper
      activeStep={activeStep}
      setActiveStep={setActiveStep}
      excelData={excelData}
      processedData={processedData}
      isProcessing={isProcessing}
      error={error}
      onlyTrustedSources={onlyTrustedSources}
      setOnlyTrustedSources={setOnlyTrustedSources}
      handleFileUpload={handleFileUpload}
      handleStartProcessing={handleStartProcessing}
      handleReset={handleReset}
    />
  );
};

export default BatchImportTab;
