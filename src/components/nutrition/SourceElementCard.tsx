import React from 'react';
import { Paper, Group, ThemeIcon, Badge, Text } from '@mantine/core';
import type { SourceElementInfo } from '../../types';
import { getNutritionIcon } from '../common/IconLibrary';

interface SourceElementCardProps {
  nutritionKey: string;
  info: SourceElementInfo;
}

const SourceElementCard: React.FC<SourceElementCardProps> = ({ nutritionKey, info }) => {
  // Kiểm tra nếu textContent có quá dài hoặc trống
  const displayedText = info.textContent && info.textContent.length > 0 
    ? (info.textContent.length > 500 
      ? info.textContent.substring(0, 500) + '...' 
      : info.textContent)
    : 'Không có nội dung văn bản';
    
  return (
    <Paper p="xs" mt={20} withBorder shadow="xs" style={{ borderColor: '#FEEBC8', backgroundColor: 'white' }}>
      <Group>
        <ThemeIcon color="yellow" variant="light" size="sm" radius="xl">
          {getNutritionIcon(nutritionKey)}
        </ThemeIcon>
        <Badge color="yellow" variant="light" radius="sm">{nutritionKey}</Badge>
        <Text size="xs" c="dimmed">{info.tagName}</Text>
      </Group>

      <Text size="sm" mt="xs" mb={20} style={{ backgroundColor: 'rgba(255, 247, 214, 0.5)', padding: '4px', borderRadius: '4px' }}>
        {displayedText}
      </Text>
    </Paper>
  );
};

export default SourceElementCard;
