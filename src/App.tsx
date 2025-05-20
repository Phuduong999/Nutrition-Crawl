import { useState } from 'react';
import { 
  MantineProvider, Container, Stack, Group, Tabs, rem, ThemeIcon, Title
} from '@mantine/core';
import { 
  IconSalad, IconChartBar, IconChevronRight, IconTable, IconList
} from '@tabler/icons-react';
import '@mantine/notifications/styles.css';
import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';

// Import custom components
import ExtractTab from './components/tabs/ExtractTab';
import PreviewTab from './components/tabs/PreviewTab';
import BatchImportTab from './components/tabs/BatchImportTab';
import LogTab from './components/tabs/LogTab';

// Import hooks
import { useNutritionExtractor } from './hooks/useNutritionExtractor';

function App() {
  const [activeTab, setActiveTab] = useState<string | null>('extract');
  const {
    loading,
    error,
    data,
    previewData,
    handleExtraction
  } = useNutritionExtractor();

  return (
    <MantineProvider theme={{
      primaryColor: 'teal',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      components: {
        Button: {
          defaultProps: {
            radius: 'md',
          },
        },
        Card: {
          defaultProps: {
            radius: 'lg',
            shadow: 'sm',
          },
        },
        Paper: {
          defaultProps: {
            radius: 'md',
          }
        },
        ScrollArea: {
          defaultProps: {
            scrollbarSize: 6,
            offsetScrollbars: true,
            type: 'auto',
            scrollHideDelay: 2500,
            overscrollBehavior: 'contain'
          }
        }
      }
    }}>
      <Container p={10} size="xs" style={{ maxWidth: '400px', width: '100%', backgroundColor: 'white' }}>
        {/* Sử dụng chiều cao auto để tránh khoảng trắng */}
        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', backgroundColor: 'white', minHeight: '0', overflow: 'hidden' }}>
        <Stack gap="md" style={{ flex: '0 0 auto' }}>
          <Group justify="center">
            <ThemeIcon size="lg" color="teal" variant="light" radius="xl">
              <IconSalad size="1.5rem" stroke={1.5} />
            </ThemeIcon>
            <Title order={2} style={{ fontWeight: 800, color: '#2A7F62' }}>
              Nutrition Data
            </Title>
          </Group>
          
          <Tabs value={activeTab} onChange={setActiveTab} variant="pills" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <Tabs.List grow style={{ marginBottom: '12px' }}>
              <Tabs.Tab 
                value="extract" 
                leftSection={<IconChartBar style={{ width: rem(16), height: rem(16) }} />}
              >
                Trích xuất
              </Tabs.Tab>
              <Tabs.Tab 
                value="preview" 
                disabled={!previewData}
                leftSection={<IconChevronRight style={{ width: rem(16), height: rem(16) }} />}
              >
                Xem chi tiết
              </Tabs.Tab>
              <Tabs.Tab 
                value="batch" 
                leftSection={<IconTable style={{ width: rem(16), height: rem(16) }} />}
              >
                Nhập hàng loạt
              </Tabs.Tab>
              <Tabs.Tab 
                value="log" 
                leftSection={<IconList style={{ width: rem(16), height: rem(16) }} />}
              >
                Log
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="extract" style={{ flex: 1, paddingRight: '4px', overflow: 'hidden' }}>
              <ExtractTab 
                loading={loading}
                error={error}
                data={data}
                handleExtraction={handleExtraction}
                setActiveTab={setActiveTab}
              />
            </Tabs.Panel>

            <Tabs.Panel value="preview" style={{ flex: 1, paddingRight: '4px', overflow: 'hidden' }}>
              <PreviewTab previewData={previewData} />
            </Tabs.Panel>
            
            <Tabs.Panel value="batch" style={{ flex: 1, paddingRight: '4px', overflow: 'hidden' }}>
              <BatchImportTab setActiveTab={setActiveTab} />
            </Tabs.Panel>
            
            <Tabs.Panel value="log" style={{ flex: 1, paddingRight: '4px', overflow: 'hidden' }}>
              <LogTab setActiveTab={setActiveTab} />
            </Tabs.Panel>
          </Tabs>
        </Stack>
        </div>
      </Container>
    </MantineProvider>
  );
}

export default App;