import React from 'react';
import { Box, Text, Button, Loader, Paper, Group, ThemeIcon, Card, List, ScrollArea } from '@mantine/core';
import { IconSalad, IconAlertCircle, IconCheck, IconChevronRight } from '@tabler/icons-react';
import type { NutritionData } from '../../types';

interface ExtractTabProps {
  loading: boolean;
  error: string | null;
  data: NutritionData | null;
  handleExtraction: () => Promise<boolean | void>;
  setActiveTab: (tab: string | null) => void;
}

const ExtractTab: React.FC<ExtractTabProps> = ({ 
  loading, 
  error, 
  data, 
  handleExtraction,
  setActiveTab
}) => {
  return (
    <ScrollArea h={350} type="auto" offsetScrollbars overscrollBehavior="contain" scrollbarSize={6} scrollHideDelay={2500}>
      <Box>
        <Text size="sm" c="dimmed" mb="md" ta="center">
          Nhấn nút bên dưới để trích xuất dữ liệu dinh dưỡng từ trang web hiện tại.
        </Text>
        
        <Button
          onClick={handleExtraction}
          disabled={loading}
          loading={loading}
          fullWidth
          size="md"
          color="teal"
          style={{ transition: 'all 0.3s ease' }}
          leftSection={loading ? <Loader size={18} /> : <IconSalad size={18} />}
        >
          {loading ? 'Đang trích xuất...' : 'Trích xuất dữ liệu dinh dưỡng'}
        </Button>

        {error && (
          <Paper p="sm" bg="red.0" withBorder mt="md" style={{ borderColor: '#FFA8A8' }}>
            <Group>
              <ThemeIcon color="red" variant="light" size="md" radius="xl">
                <IconAlertCircle size="1rem" />
              </ThemeIcon>
              <Text size="sm" c="red.9">{error}</Text>
            </Group>
          </Paper>
        )}

        {data && !error && (
          <Card mt="md" withBorder style={{ borderColor: '#D8F3DC', backgroundColor: '#F0FFF4' }}>
            <Group>
              <ThemeIcon color="teal" variant="light" size="md" radius="xl">
                <IconCheck size="1rem" />
              </ThemeIcon>
              <Box>
                <Text size="sm" fw={500} c="teal.8">
                  Trích xuất thành công!
                </Text>
                <Text size="xs" c="dimmed">
                  File JSON đã được tải xuống.
                </Text>
              </Box>
              
              <Button 
                variant="subtle" 
                color="teal" 
                size="xs" 
                ml="auto"
                rightSection={<IconChevronRight size={14} />}
                onClick={() => setActiveTab('preview')}
              >
                Xem chi tiết
              </Button>
            </Group>
          </Card>
        )}
        
        <Card withBorder mt="lg" p="md" style={{ backgroundColor: '#F9FAFB' }}>
          <Text size="sm" fw={500} mb="xs">Hướng dẫn sử dụng</Text>
          <List size="xs" spacing="xs" c="dimmed">
            <List.Item>Truy cập trang có thông tin dinh dưỡng</List.Item>
            <List.Item>Nhấp vào nút "Trích xuất dữ liệu dinh dưỡng"</List.Item>
            <List.Item>Phần tử được trích xuất sẽ được bôi vàng</List.Item>
            <List.Item>Dữ liệu sẽ được lưu và tải xuống tự động</List.Item>
          </List>
        </Card>
      </Box>
    </ScrollArea>
  );
};

export default ExtractTab;
