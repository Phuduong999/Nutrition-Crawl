import React, { useState } from 'react';
import { Group, Text, useMantineTheme, Tooltip, Progress, Overlay, Center, rem } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import type { FileWithPath } from '@mantine/dropzone';
import { IconUpload, IconX, IconFileSpreadsheet, IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { read, utils } from 'xlsx';
import type { ExcelRow } from '../../types';

interface ExcelUploaderProps {
  onUpload: (rows: ExcelRow[]) => void;
  isLoading?: boolean;
  uploadStatus?: 'idle' | 'processing' | 'complete';
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({ 
  onUpload, 
  isLoading = false,
  uploadStatus = 'idle'
}) => {
  const theme = useMantineTheme();

  const [processingProgress, setProcessingProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  const processFile = async (files: FileWithPath[]) => {
    setProcessingProgress(10);
    setFileError(null);
    if (files.length === 0) return;
    
    try {
      const file = files[0];
      setProcessingProgress(30);
      const data = await file.arrayBuffer();
      setProcessingProgress(50);
      const workbook = read(data);
    
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      setProcessingProgress(70);
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
      
      setProcessingProgress(100);
      
      if (rows.length === 0) {
        setFileError('Không tìm thấy cột "trusted source" hoặc không có dữ liệu URL trong file Excel');
        return;
      }
      
      onUpload(rows);
    } catch (error) {
      setFileError('Lỗi xử lý file: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'));
      setProcessingProgress(0);
    }
  };

  // Hiển thị icon phù hợp với trạng thái
  const getStatusIcon = () => {
    switch(uploadStatus) {
      case 'processing':
        return <IconUpload size="3.2rem" stroke={1.5} color={theme.colors.blue[6]} />
      case 'complete':
        return <IconCheck size="3.2rem" stroke={1.5} color={theme.colors.green[6]} />
      default:
        return <IconFileSpreadsheet size="3.2rem" stroke={1.5} />
    }
  }

  return (
    <Tooltip 
      label="Tải lên file Excel có cột 'trusted source' chứa URL cần xử lý" 
      position="top"
      withArrow
      multiline
      w={220}
    >
      <Dropzone
        onDrop={processFile}
        maxSize={5 * 1024 ** 2}
        accept={[
          'application/vnd.ms-excel', 
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]}
        loading={isLoading}
        disabled={isLoading || uploadStatus === 'processing'}
        style={{ position: 'relative' }}
      >
        {/* Overlay hiển thị trạng thái đang xử lý */}
        {uploadStatus === 'processing' && (
          <Overlay color="#fff" backgroundOpacity={0.85} center>
            <Center>
              <div style={{ width: '80%', maxWidth: 400 }}>
                <Text ta="center" fw={700} mb="md">Đang xử lý file Excel...</Text>
                <Progress value={processingProgress} size="lg" radius="xl" striped animated />
                <Text ta="center" fz="sm" mt="xs" c="dimmed">
                  Đã hoàn thành {processingProgress}%
                </Text>
              </div>
            </Center>
          </Overlay>
        )}

        {/* Overlay hiển thị trạng thái đã hoàn thành */}
        {uploadStatus === 'complete' && (
          <Overlay color="#fff" backgroundOpacity={0.85} center>
            <Center>
              <div>
                <IconCheck style={{ display: 'block', margin: '0 auto' }} size={40} stroke={1.5} color={theme.colors.green[6]} />
                <Text ta="center" fw={700} mt="md">
                  Đã tải lên thành công
                </Text>
              </div>
            </Center>
          </Overlay>
        )}

        <Group justify="center" gap="xl" style={{ minHeight: 180, pointerEvents: 'none' }}>
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
            {getStatusIcon()}
          </Dropzone.Idle>

          <div>
            <Group align="center">
              <Text size="xl" inline>
                Kéo file Excel vào đây hoặc nhấp để chọn file
              </Text>
              <Tooltip label="File Excel cần có cột 'trusted source' với các URL cần trích xuất dữ liệu dinh dưỡng">
                <IconInfoCircle size={rem(16)} style={{ cursor: 'pointer' }} />
              </Tooltip>
            </Group>

            <Text size="sm" color="dimmed" inline mt={7}>
              Chỉ chấp nhận file Excel (.xls, .xlsx) - Cột F phải chứa URL
            </Text>

            {fileError && (
              <Text color="red" size="sm" mt="xs">
                {fileError}
              </Text>
            )}
          </div>
        </Group>
      </Dropzone>
    </Tooltip>
  );
};

export default ExcelUploader;
