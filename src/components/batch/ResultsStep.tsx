import React from 'react';
import { Stack, Button, Group, Text, Alert } from '@mantine/core';
import { IconDownload, IconCheck } from '@tabler/icons-react';
import BatchPreview from '../excel/BatchPreview';
import { utils, write } from 'xlsx';
import type { ExcelRow } from '../../types';

interface ResultsStepProps {
  processedData: ExcelRow[];
  onReset: () => void;
  onPrevStep: () => void;
}

const ResultsStep: React.FC<ResultsStepProps> = ({
  processedData,
  onReset,
  onPrevStep
}) => {
  const successCount = processedData.filter(row => row.status === 'completed').length;
  const failedCount = processedData.filter(row => row.status === 'failed').length;
  
  const handleExport = () => {
    // Tạo dữ liệu Excel
    const exportData = processedData.map(row => {
      // Tạo object chứa dữ liệu xuất
      const exportRow: Record<string, any> = {
        'URL': row.url,
        'Trạng thái': row.status === 'completed' ? 'Thành công' : 'Thất bại',
      };
      
      // Thêm các trường dữ liệu dinh dưỡng
      Object.entries(row.extractedData).forEach(([field, value]) => {
        const columnLabel = field.replace('column', 'Cột ');
        exportRow[columnLabel] = value || 'Không có dữ liệu';
      });
      
      return exportRow;
    });
    
    // Tạo workbook và worksheet
    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Kết quả xử lý');
    
    // Tạo file Excel và download
    const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    // Tạo URL để download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nutrition_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <Stack gap="md" style={{ backgroundColor: 'white' }}>
      <Alert title="Hoàn thành" color="green" variant="light">
        <Text size="sm">
          Đã xử lý xong {processedData.length} URL, có {successCount} thành công và {failedCount} thất bại.
        </Text>
      </Alert>
      
      <BatchPreview data={processedData} />
      
      <Group justify="space-between" mt="md">
        <Button 
          variant="default" 
          onClick={onPrevStep}
        >
          Quay lại
        </Button>
        
        <Group gap="xs">
          <Button 
            variant="light" 
            color="blue"
            leftSection={<IconDownload size="1rem" />}
            onClick={handleExport}
          >
            Xuất kết quả
          </Button>
          
          <Button 
            leftSection={<IconCheck size="1rem" />}
            onClick={onReset}
          >
            Hoàn thành
          </Button>
        </Group>
      </Group>
    </Stack>
  );
};

export default ResultsStep;
