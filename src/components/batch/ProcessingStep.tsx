import React, { useState, useEffect } from 'react';
import { Stack, Button, Group, Text, Alert, Paper, Tooltip, Box } from '@mantine/core';
import { IconRobot, IconAlertCircle } from '@tabler/icons-react';
import BatchProcessingTable from '../excel/BatchProcessingTable';
import type { ExcelRow } from '../../types';

interface ProcessingStepProps {
  excelData: ExcelRow[];
  processedData: ExcelRow[];
  isProcessing: boolean;
  error: string | null;
  onlyTrustedSources: boolean;
  onStartProcessing: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({
  excelData,
  processedData,
  isProcessing,
  error,
  onlyTrustedSources,
  onStartProcessing,
  onNextStep,
  onPrevStep
}) => {
  // Tỷ lệ tiến trình được tính toán để hiển thị bên trong BatchProcessingTable
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  // Tính toán URL đang được xử lý
  useEffect(() => {
    if (excelData.length === 0) return;
    
    // Tìm URL đang xử lý hiện tại (nếu có)
    const processingRow = processedData.find(row => row.status === 'processing');
    setCurrentUrl(processingRow ? processingRow.url : null);
  }, [processedData, excelData]);
  
  // Đếm số lượng URL đã xử lý theo trạng thái
  const getStatusCounts = () => {
    if (processedData.length === 0) return { total: 0, completed: 0, failed: 0, pending: 0, processing: 0 };
    
    return {
      total: processedData.length,
      completed: processedData.filter(row => row.status === 'completed').length,
      failed: processedData.filter(row => row.status === 'failed').length,
      pending: processedData.filter(row => row.status === 'pending').length,
      processing: processedData.filter(row => row.status === 'processing').length
    };
  };
  
  const statusCounts = getStatusCounts();

  return (
    <Stack gap="md" style={{ backgroundColor: 'white' }}>
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Lỗi" color="red" variant="filled">
          {error}
        </Alert>
      )}

      {/* Bảng thống kê nhanh */}
      {processedData.length > 0 && (
        <Paper p="xs" radius="md" mb="sm" withBorder>
          <Group gap="md" align="center">
            <Tooltip label="Số URL đã xử lý hoàn tất và trích xuất được dữ liệu">
              <Group gap="xs">
                <Box
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#2ecc71'
                  }}
                />
                <Text size="sm" fw={600}>{statusCounts.completed} thành công</Text>
              </Group>
            </Tooltip>
            
            <Tooltip label="Số URL đã xử lý nhưng gặp lỗi hoặc không trích xuất được dữ liệu">
              <Group gap="xs">
                <Box
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#e74c3c'
                  }}
                />
                <Text size="sm" fw={600}>{statusCounts.failed} thất bại</Text>
              </Group>
            </Tooltip>
            
            <Tooltip label="Số URL đang được xử lý">
              <Group gap="xs">
                <Box
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#3498db',
                    animation: isProcessing ? 'pulse 1.5s infinite' : 'none'
                  }}
                />
                <Text size="sm" fw={600}>{statusCounts.processing} đang xử lý</Text>
              </Group>
            </Tooltip>

            <Tooltip label="Số URL đang chờ xử lý">
              <Group gap="xs">
                <Box
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#7f8c8d'
                  }}
                />
                <Text size="sm" fw={600}>{statusCounts.pending} chờ xử lý</Text>
              </Group>
            </Tooltip>
          </Group>
        </Paper>
      )}

      <BatchProcessingTable 
        data={processedData} 
        isProcessing={isProcessing}
        currentlyProcessingUrl={currentUrl}
        progressCount={processedData.filter(row => row.status !== 'pending').length}
        totalCount={excelData.length}
      />
      
      {/* Tiến trình đã được chuyển vào bảng BatchProcessingTable */}
      
      <Group justify="space-between" mt="md">
        <Button 
          variant="default" 
          onClick={onPrevStep}
          disabled={isProcessing}
        >
          Quay lại
        </Button>

        {!isProcessing && processedData.filter(row => row.status === 'completed').length === 0 && (
          <Button 
            leftSection={<IconRobot size="1rem" />}
            onClick={onStartProcessing}
          >
            Bắt đầu xử lý {excelData.length} URL{onlyTrustedSources ? ' (chỉ nguồn tin cậy)' : ''}
          </Button>
        )}
        
        {processedData.filter(row => row.status === 'completed').length > 0 && (
          <Button 
            onClick={onNextStep}
            disabled={isProcessing}
          >
            Xem kết quả ({processedData.filter(row => row.status === 'completed').length} thành công)
          </Button>
        )}
      </Group>
    </Stack>
  );
};

export default ProcessingStep;
