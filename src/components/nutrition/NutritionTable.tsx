import React from 'react';
import { Table, Group, Text, ThemeIcon, Badge } from '@mantine/core';
import type { NutritionData, NutritionPreview } from '../../types';
import { getNutritionIcon } from '../common/IconLibrary';
import { getNutritionColor, isValueMeaningful, getNutritionUnit, nutritionLabels } from '../../utils/helpers';

interface NutritionTableProps {
  data: NutritionData;
  previewData: NutritionPreview | null;
}

const NutritionTable: React.FC<NutritionTableProps> = ({ data, previewData }) => {
  // Hiển thị giá trị dinh dưỡng với nhãn người dùng và icon
  const renderNutritionValue = (key: string, value: number | null | string) => {
    const highlighted = previewData?.sourceInfo?.[key] ? true : false;
    
    if (value === null) return null;
    
    return (
      <Table.Tr key={key} style={highlighted ? { backgroundColor: 'rgba(255, 250, 225, 0.6)' } : {}}>
        <Table.Td style={{ padding: '6px 8px' }}>
          <Group gap="xs" wrap="nowrap">
            <ThemeIcon color={highlighted ? 'yellow' : getNutritionColor(key)} variant="light" size="sm" radius="xl" style={{ flexShrink: 0 }}>
              {getNutritionIcon(key)}
            </ThemeIcon>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Text size="sm" fw={500} truncate>{nutritionLabels[key] || key}</Text>
              {highlighted && <Badge color="yellow" size="xs" variant="dot" mt={2}>Tìm thấy</Badge>}
            </div>
          </Group>
        </Table.Td>
        <Table.Td style={{ padding: '6px 4px', textAlign: 'right', width: '80px', maxWidth: '80px' }}>
          <Group justify="flex-end" gap={2} wrap="nowrap">
            {isValueMeaningful(value) ? (
              <>
                <Text fw={600} size="sm" truncate style={{ maxWidth: '60px' }}>{value.toString()}</Text>
                <Text size="xs" c="dimmed" style={{ width: '14px', textAlign: 'left' }}>{getNutritionUnit(key)}</Text>
              </>
            ) : (
              <Text c="dimmed" size="xs" fs="italic">Không có</Text>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  };

  return (
    <Table striped highlightOnHover withColumnBorders style={{ minWidth: '100%' }}>
      <Table.Thead>
        <Table.Tr style={{ backgroundColor: '#EDF2F7' }}>
          <Table.Th style={{ width: '65%', padding: '6px 8px' }}>Dinh dưỡng</Table.Th>
          <Table.Th style={{ width: '35%', textAlign: 'right', padding: '6px 8px' }}>Giá trị</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {/* Thông tin khẩu phần */}
        {data.amount_per && (
          <Table.Tr style={{ backgroundColor: '#F0F9FF' }}>
            <Table.Td colSpan={2}>
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon color="blue" variant="light" size="sm" radius="xl">
                  <>{getNutritionIcon('amount_per')}</>
                </ThemeIcon>
                <Text fw={500} size="sm" truncate>Khẩu phần: {data.amount_per}</Text>
              </Group>
            </Table.Td>
          </Table.Tr>
        )}
        
        {/* Calories - Macros */}
        <Table.Tr style={{ backgroundColor: '#FFFBEB' }}>
          <Table.Td colSpan={2}>
            <Text size="xs" fw={600} c="orange.8">NĂNG LƯỢNG & MACROS</Text>
          </Table.Td>
        </Table.Tr>
        {['calories', 'protein', 'fat', 'carbs'].map(key => 
          data[key as keyof NutritionData] !== undefined && 
          renderNutritionValue(key, data[key as keyof NutritionData])
        )}
        
        {/* Chi tiết carbs */}
        <Table.Tr style={{ backgroundColor: '#F0FFF4' }}>
          <Table.Td colSpan={2}>
            <Text size="xs" fw={600} c="green.8">CHI TIẾT CARBS</Text>
          </Table.Td>
        </Table.Tr>
        {['fiber', 'sugar', 'added_sugar'].map(key => 
          data[key as keyof NutritionData] !== undefined && 
          renderNutritionValue(key, data[key as keyof NutritionData])
        )}
        
        {/* Chi tiết chất béo */}
        <Table.Tr style={{ backgroundColor: '#FFF5F5' }}>
          <Table.Td colSpan={2}>
            <Text size="xs" fw={600} c="red.8">CHI TIẾT CHẤT BÉO</Text>
          </Table.Td>
        </Table.Tr>
        {['saturated_fat', 'cholesterol'].map(key => 
          data[key as keyof NutritionData] !== undefined && 
          renderNutritionValue(key, data[key as keyof NutritionData])
        )}
        
        {/* Khoáng chất */}
        <Table.Tr style={{ backgroundColor: '#F0F4FF' }}>
          <Table.Td colSpan={2}>
            <Text size="xs" fw={600} c="indigo.8">KHOÁNG CHẤT</Text>
          </Table.Td>
        </Table.Tr>
        {['sodium', 'calcium', 'iron'].map(key => 
          data[key as keyof NutritionData] !== undefined && 
          renderNutritionValue(key, data[key as keyof NutritionData])
        )}
      </Table.Tbody>
    </Table>
  );
};

export default NutritionTable;
