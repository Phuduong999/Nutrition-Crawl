import React from 'react';
import { Box, Card, Text, Group, ThemeIcon, Badge, ScrollArea, Divider } from '@mantine/core';
import { IconLeaf } from '@tabler/icons-react';
import type { NutritionPreview } from '../../types';
import NutritionTable from '../nutrition/NutritionTable';
import NutritionStats from '../nutrition/NutritionStats';
import SourceElementCard from '../nutrition/SourceElementCard';

interface PreviewTabProps {
  previewData: NutritionPreview | null;
}

const PreviewTab: React.FC<PreviewTabProps> = ({ previewData }) => {
  if (!previewData) return null;
  
  return (
    <ScrollArea h={350} type="auto" offsetScrollbars overscrollBehavior="contain" scrollbarSize={6} scrollHideDelay={2500}>
      <Box>
        <Card withBorder mb="md" p="sm" style={{ backgroundColor: '#F9FAFB' }}>
          <Group gap="sm" mb="xs">
            <ThemeIcon color="blue" variant="light" size="md" radius="xl">
              <IconLeaf size="1rem" />
            </ThemeIcon>
            <Text fw={500}>Nguồn thông tin</Text>
          </Group>
          <Text fw={500} size="sm" lineClamp={1}>{previewData.title}</Text>
          <Text size="xs" c="dimmed" component="a" href={previewData.url} target="_blank" lineClamp={1}>
            {previewData.url}
          </Text>
          
          <NutritionStats previewData={previewData} />
        </Card>

        <Card withBorder mb="md" shadow="xs" style={{ overflow: 'hidden' }}>
          <Box p="xs" pb={0} style={{ backgroundColor: '#F9FCFC' }}>
            <Group justify="apart" mb="xs" wrap="nowrap">
              <Text fw={600} size="sm" c="teal.7">Thông tin dinh dưỡng</Text>
              <Badge size="sm" color="blue" variant="light">
                {Object.entries(previewData.data).filter(([_, v]) => v !== null && v !== '').length}
              </Badge>
            </Group>
          </Box>
          <ScrollArea type="auto" scrollbarSize={6} scrollHideDelay={2500} offsetScrollbars>
            <NutritionTable data={previewData.data} previewData={previewData} />
          </ScrollArea>
        </Card>

        <Divider my="md" label="Phần tử được bôi vàng" labelPosition="center" />
        
        <Text fw={600} size="sm" mb="sm" c="orange.8">
          Các phần tử được bôi vàng trên trang
        </Text>
        
        {Object.entries(previewData.sourceInfo).length > 0 ? (
          Object.entries(previewData.sourceInfo).map(([key, info]) => (
            <SourceElementCard key={key} nutritionKey={key} info={info} />
          ))
        ) : (
          <Text size="sm" c="dimmed" ta="center" py="lg">
            Không tìm thấy phần tử được bôi vàng
          </Text>
        )}
      </Box>
    </ScrollArea>
  );
};

export default PreviewTab;
