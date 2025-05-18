import React from 'react';
import { Group, Text, useMantineTheme } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import type { FileWithPath } from '@mantine/dropzone';
import { IconUpload, IconX, IconFileSpreadsheet } from '@tabler/icons-react';
import { read, utils } from 'xlsx';
import type { ExcelRow } from '../../types';

interface ExcelUploaderProps {
  onUpload: (rows: ExcelRow[]) => void;
  isLoading?: boolean;
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onUpload, isLoading = false }) => {
  const theme = useMantineTheme();

  const processFile = async (files: FileWithPath[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    const data = await file.arrayBuffer();
    const workbook = read(data);
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json(worksheet);
    
    // Chuyển đổi dữ liệu thành định dạng ExcelRow
    const rows: ExcelRow[] = jsonData
      .filter((row: any) => row['trusted source'] && typeof row['trusted source'] === 'string')
      .map((row: any) => ({
        url: row['trusted source'] || '',  // Cột F
        extractedData: {
          columnK: null,
          columnL: null,
          columnM: null,
          columnN: null,
          columnO: null,
          columnP: null,
          columnQ: null,
          columnR: null,
          columnS: null,
          columnT: null
        },
        status: 'pending'
      }));
    
    onUpload(rows);
  };

  return (
    <Dropzone
      onDrop={processFile}
      maxSize={5 * 1024 ** 2}
      accept={[
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]}
      loading={isLoading}
      disabled={isLoading}
    >
      <Group justify="center" gap="xl" style={{ minHeight: 220, pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <IconUpload
            size="3.2rem"
            stroke={1.5}
            color={theme.colors[theme.primaryColor][6]}
          />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX
            size="3.2rem"
            stroke={1.5}
            color={theme.colors.red[6]}
          />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconFileSpreadsheet size="3.2rem" stroke={1.5} />
        </Dropzone.Idle>

        <div>
          <Text size="xl" inline>
            Kéo file Excel vào đây hoặc nhấp để chọn file
          </Text>
          <Text size="sm" color="dimmed" inline mt={7}>
            Chỉ chấp nhận file Excel (.xls, .xlsx) - Cột F phải chứa URL
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
};

export default ExcelUploader;
