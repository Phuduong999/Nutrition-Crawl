import React from 'react';
import { Table, Badge, ScrollArea, Text, Tooltip, Group, Progress, rem } from '@mantine/core';
import { IconExternalLink, IconInfoCircle, IconAlertCircle } from '@tabler/icons-react';
import type { ExcelRow } from '../../types';
import { getDescriptionFromField } from '../../config/xpathMapping';

interface BatchProcessingTableProps {
  data: ExcelRow[];
  isProcessing?: boolean;
  currentlyProcessingUrl?: string | null;
  progressCount?: number;
  totalCount?: number;
}

const BatchProcessingTable: React.FC<BatchProcessingTableProps> = ({ 
  data, 
  isProcessing = false,
  currentlyProcessingUrl = null,
  progressCount = 0,
  totalCount = 0
}) => {
  if (data.length === 0) {
    return (
      <Text ta="center" c="dimmed" fz="sm" p="md">
        Chưa có dữ liệu. Vui lòng tải lên file Excel trước.
      </Text>
    );
  }

  const getStatusBadge = (status: string, url: string) => {
    // Hiện badge đặc biệt cho URL đang được xử lý hiện tại
    if (isProcessing && currentlyProcessingUrl === url) {
      return (
        <Tooltip label="URL này đang được xử lý">
          <Badge color="blue" variant="dot" styles={{ root: { animation: 'pulse 1.5s infinite' } }}>Đang xử lý</Badge>
        </Tooltip>
      );
    }
    
    switch (status) {
      case 'pending':
        return (
          <Tooltip label="URL này đang được xếp hàng chờ xử lý">
            <Badge color="gray">Chờ xử lý</Badge>
          </Tooltip>
        );
      case 'processing':
        return (
          <Tooltip label="URL này đang được xử lý">
            <Badge color="blue">Đang xử lý</Badge>
          </Tooltip>
        );
      case 'completed':
        return (
          <Tooltip label="Đã trích xuất thành công dữ liệu từ URL này">
            <Badge color="green">Hoàn thành</Badge>
          </Tooltip>
        );
      case 'failed':
        return (
          <Tooltip label="Không thể trích xuất dữ liệu từ URL này">
            <Badge color="red" rightSection={<IconAlertCircle size="0.8rem" />}>Thất bại</Badge>
          </Tooltip>
        );
      default:
        return <Badge color="gray">Không xác định</Badge>;
    }
  };

  const getDataValue = (row: ExcelRow, field: string) => {
    const value = row.extractedData[field];
    if (value === null || value === '') {
      return <Text c="dimmed" fz="xs">Không có dữ liệu</Text>;
    }
    return <Text fz="xs">{value}</Text>;
  };

  // Hiển thị thanh tiến trình
  const renderProgress = () => {
    if (!isProcessing || totalCount === 0) return null;
    
    const progressPercentage = Math.round((progressCount / totalCount) * 100);
    
    return (
      <div style={{ marginBottom: rem(10) }}>
        <Group justify="space-between" mb={5}>
          <Text fz="sm" fw={500}>Tiến trình xử lý</Text>
          <Text fz="xs" c="dimmed">{progressCount}/{totalCount} URL</Text>
        </Group>
        <Progress 
          value={progressPercentage} 
          size="sm" 
          animated={isProcessing}
          color={progressPercentage === 100 ? 'green' : 'blue'}
        />
        {currentlyProcessingUrl && (
          <Text fz="xs" c="dimmed" mt={5} truncate maw={300}>
            Đang xử lý: {currentlyProcessingUrl}
          </Text>
        )}
      </div>
    );
  };

  return (
    <>
      {renderProgress()}
      <ScrollArea h={300} type="auto" scrollbarSize={6} scrollHideDelay={1000}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: '40px' }}>
              <Tooltip label="Số thứ tự">
                <Text>STT</Text>
              </Tooltip>
            </Table.Th>
            <Table.Th>
              <Tooltip label="Đường dẫn đến trang web chứa dữ liệu dinh dưỡng">
                <Group gap={5}>
                  <Text>URL</Text>
                  <IconInfoCircle size="0.8rem" stroke={1.5} opacity={0.7} />
                </Group>
              </Tooltip>
            </Table.Th>
            <Table.Th>
              <Tooltip label="Tiến trình xử lý của URL: Chờ xử lý, Đang xử lý, Hoàn thành, Thất bại">
                <Group gap={5}>
                  <Text>Trạng thái</Text>
                  <IconInfoCircle size="0.8rem" stroke={1.5} opacity={0.7} />
                </Group>
              </Tooltip>
            </Table.Th>
            {Object.keys(data[0].extractedData).map(field => (
              <Table.Th key={field}>
                <Tooltip label={getDescriptionFromField(field)} position="top">
                  <Text>{field.replace('column', '')}</Text>
                </Tooltip>
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((row, index) => (
            <Table.Tr key={index}>
              <Table.Td>{index + 1}</Table.Td>
              <Table.Td>
                <Tooltip label={row.url}>
                  <Text 
                    component="a" 
                    href={row.url} 
                    target="_blank" 
                    fz="xs" 
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <IconExternalLink size="0.8rem" />
                    {row.url.length > 30 ? row.url.substring(0, 27) + '...' : row.url}
                  </Text>
                </Tooltip>
              </Table.Td>
              <Table.Td>{getStatusBadge(row.status, row.url)}</Table.Td>
              {Object.keys(row.extractedData).map(field => (
                <Table.Td key={field}>
                  {getDataValue(row, field)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
    </>

  );
};

export default BatchProcessingTable;
