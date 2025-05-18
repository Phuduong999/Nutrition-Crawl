import React from 'react';
import { Table, Text, ScrollArea, Badge, Tooltip } from '@mantine/core';
import type { ExcelRow } from '../../types';
import { getDescriptionFromField } from '../../config/xpathMapping';

interface BatchPreviewProps {
  data: ExcelRow[];
}

const BatchPreview: React.FC<BatchPreviewProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <Text ta="center" c="dimmed" fz="sm" p="md">
        Chưa có dữ liệu để hiển thị.
      </Text>
    );
  }

  const getCompletedCount = () => {
    return data.filter(row => row.status === 'completed').length;
  };

  const getFailedCount = () => {
    return data.filter(row => row.status === 'failed').length;
  };

  const getSummary = () => {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <Text size="sm" fw={500} mb="xs">
          Tổng kết:
        </Text>
        <Text size="xs">
          Tổng số URL: <Badge color="blue">{data.length}</Badge>
        </Text>
        <Text size="xs">
          Hoàn thành: <Badge color="green">{getCompletedCount()}</Badge>
        </Text>
        <Text size="xs">
          Thất bại: <Badge color="red">{getFailedCount()}</Badge>
        </Text>
      </div>
    );
  };

  return (
    <>
      {getSummary()}
      <ScrollArea h={300} type="auto" scrollbarSize={6} scrollHideDelay={2500}>
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
                    <Text fz="xs">
                      {row.url.length > 30 ? row.url.substring(0, 27) + '...' : row.url}
                    </Text>
                  </Tooltip>
                </Table.Td>
                <Table.Td>
                  {row.status === 'completed' ? (
                    <Badge color="green">Hoàn thành</Badge>
                  ) : row.status === 'failed' ? (
                    <Badge color="red">Thất bại</Badge>
                  ) : (
                    <Badge color="gray">Chờ xử lý</Badge>
                  )}
                </Table.Td>
                {Object.keys(row.extractedData).map(field => (
                  <Table.Td key={field}>
                    {row.extractedData[field] ? (
                      <Text fz="xs">{row.extractedData[field]}</Text>
                    ) : (
                      <Text c="dimmed" fz="xs">Không có dữ liệu</Text>
                    )}
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

export default BatchPreview;
