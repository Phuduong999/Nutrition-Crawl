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
    try {
      // Chỉ xuất các hàng có originalData để giữ nguyên cấu trúc
      const rowsWithOriginalData = processedData.filter(row => row.originalData);
      
      if (rowsWithOriginalData.length === 0) {
        alert('Không có dữ liệu gốc để xuất');
        return;
      }
      
      // Tạo worksheet từ dữ liệu gốc trước
      const dataToExport = rowsWithOriginalData.map(row => {
        return { ...row.originalData };
      });
      
      // Tạo workbook và worksheet
      const wb = utils.book_new();
      const ws = utils.json_to_sheet(dataToExport);
      
      // Chỉ cập nhật các ô cần thiết (K-T) dựa trên address của cell 
      rowsWithOriginalData.forEach((row, rowIndex) => {
        if (row.status === 'completed') {
          // Bắt đầu từ hàng thứ 2 (chỉ số 1 do hàng 0 là header)
          const rowNum = rowIndex + 2;
          
          // Các cột cần cập nhật (K-T)
          const columnsToUpdate = [
            { col: 'K', field: 'columnK' }, // Protein
            { col: 'L', field: 'columnL' }, // Carb
            { col: 'M', field: 'columnM' }, // Fat
            { col: 'N', field: 'columnN' }, // Calo
            { col: 'O', field: 'columnO' }, // Fiber
            { col: 'P', field: 'columnP' }, // Sugar
            { col: 'Q', field: 'columnQ' }, // Cholesterol
            { col: 'R', field: 'columnR' }, // Saturated Fat
            { col: 'S', field: 'columnS' }, // Canxi
            { col: 'T', field: 'columnT' }  // Iron
          ];
          
          // Cập nhật từng cột
          columnsToUpdate.forEach(({ col, field }) => {
            if (row.extractedData[field]) {
              // Định vị cell (ví dụ: K2, L2, ...)
              const cellRef = `${col}${rowNum}`;
              
              // Cập nhật cell
              const cellValue = row.extractedData[field] || '';
              
              // Sử dụng phương thức cập nhật cell trực tiếp
              if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
              ws[cellRef].v = cellValue;
            }
          });
        }
      });
      
      // Thêm worksheet vào workbook và đặt tên
      utils.book_append_sheet(wb, ws, 'Nutrition_Data');
    
      // Xuất file Excel
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
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      alert(`Lỗi khi xuất file Excel: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
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
