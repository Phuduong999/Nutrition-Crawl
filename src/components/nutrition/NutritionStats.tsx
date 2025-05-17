import React from 'react';
import { Group, RingProgress, Text, Tooltip, Box, Stack, Badge } from '@mantine/core';
import type { NutritionPreview } from '../../types';
import { calculateNutritionStats } from '../../utils/helpers';

interface NutritionStatsProps {
  previewData: NutritionPreview;
}

const NutritionStats: React.FC<NutritionStatsProps> = ({ previewData }) => {
  const nutritionStats = calculateNutritionStats(previewData);
  
  return (
    <Group mt="sm" justify="space-between">
      <Tooltip label="Độ đầy đủ dữ liệu">
        <RingProgress
          size={60}
          thickness={4}
          roundCaps
          sections={[{ value: nutritionStats.completeness, color: 'teal' }]}
          label={
            <Text fw={700} ta="center" size="xs">
              {Math.round(nutritionStats.completeness)}%
            </Text>
          }
        />
      </Tooltip>
      <Box>
        <Stack gap="xs">
          <Group gap={4}>
            <Badge size="sm" radius="sm" color="teal" variant="filled">
              {nutritionStats.foundCount}/{12}
            </Badge>
            <Text size="xs">tìm thấy</Text>
          </Group>
          <Group gap={4}>
            <Badge size="sm" radius="sm" color="yellow" variant="filled">
              {nutritionStats.highlightedCount}
            </Badge>
            <Text size="xs">bôi vàng</Text>
          </Group>
        </Stack>
      </Box>
    </Group>
  );
};

export default NutritionStats;
