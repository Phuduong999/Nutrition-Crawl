import React from 'react';
import { Alert, Stack, Checkbox, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import ExcelUploader from '../excel/ExcelUploader';
import type { ExcelRow } from '../../types';

interface UploadStepProps {
  onFileUpload: (rows: ExcelRow[]) => void;
  error: string | null;
  onlyTrustedSources: boolean;
  setOnlyTrustedSources: (value: boolean) => void;
}

const UploadStep: React.FC<UploadStepProps> = ({
  onFileUpload,
  error,
  onlyTrustedSources,
  setOnlyTrustedSources
}) => {
  return (
    <Stack gap="md" style={{ backgroundColor: 'white' }}>
      <ExcelUploader onUpload={onFileUpload} />
      
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Lỗi" color="red" variant="filled">
          {error}
        </Alert>
      )}
      
      <Checkbox
        checked={onlyTrustedSources}
        onChange={(e) => setOnlyTrustedSources(e.currentTarget.checked)}
        label={
          <Text size="sm">
            Chỉ xử lý các URL đến từ nguồn tin cậy (Nutritionix, EatThisMuch, ...)
          </Text>
        }
      />
      
      <Alert title="Hướng dẫn" color="blue" variant="light">
        <Text size="sm">
          Tải lên file Excel có chứa cột <b>trusted source</b> với các URL cần xử lý.
          Hệ thống sẽ trích xuất thông tin dinh dưỡng tự động và điền vào các cột từ K đến T.
        </Text>
      </Alert>
    </Stack>
  );
};

export default UploadStep;
