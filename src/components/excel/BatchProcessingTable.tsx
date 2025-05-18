import React from 'react';
import { Table, Badge, ScrollArea, Text, Tooltip } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import type { ExcelRow } from '../../types';
import { getDescriptionFromField } from '../../config/xpathMapping';

interface BatchProcessingTableProps {
  data: ExcelRow[];
  isProcessing?: boolean;
}

const BatchProcessingTable: React.FC<BatchProcessingTableProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <Text ta="center" c="dimmed" fz="sm" p="md">
        Chưa có dữ liệu. Vui lòng tải lên file Excel trước.
      </Text>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge color="gray">Chờ xử lý</Badge>;
      case 'processing':
        return <Badge color="blue">Đang xử lý</Badge>;
      case 'completed':
        return <Badge color="green">Hoàn thành</Badge>;
      case 'failed':
        return <Badge color="red">Thất bại</Badge>;
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

  return (
    <ScrollArea h={350} type="auto" scrollbarSize={6} scrollHideDelay={2500}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>STT</Table.Th>
            <Table.Th>URL</Table.Th>
            <Table.Th>Trạng thái</Table.Th>
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
              <Table.Td>{getStatusBadge(row.status)}</Table.Td>
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
  );
};

export default BatchProcessingTable;
