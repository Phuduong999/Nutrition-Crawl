import { useState, useEffect } from 'react';
import { 
  MantineProvider, Container, Stack, Group, Text, Badge, Card, Paper, Box, Button, Table, Loader, Tabs, rem, ThemeIcon, RingProgress, Title, List, Tooltip, 
  Divider, ScrollArea
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { 
  IconFlame, IconEgg, IconCheese, IconBread, IconSalad, IconLeaf, IconApple, IconHeartFilled, IconScale, IconChartBar, IconCheck, IconAlertCircle, IconChevronRight
} from '@tabler/icons-react';
import type { NutritionData } from './config/trustedSources';
import '@mantine/core/styles.css';

// Interface cho dữ liệu phần tử được bôi vàng
interface SourceElementInfo {
  tagName: string;
  textContent: string;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

interface NutritionPreview {
  url: string;
  title: string;
  timestamp: string;
  data: NutritionData;
  sourceInfo: Record<string, SourceElementInfo>;
}

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NutritionData | null>(null);
  const [previewData, setPreviewData] = useState<NutritionPreview | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('extract');

  // Tải dữ liệu từ chrome.storage khi component được mount
  useEffect(() => {
    chrome.storage.local.get(['nutritionPreview'], (result) => {
      if (result.nutritionPreview) {
        setPreviewData(result.nutritionPreview);
        setData(result.nutritionPreview.data);
        console.log('Loaded nutrition preview:', result.nutritionPreview);
      }
    });
  }, []);

  const extractNutrition = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Getting current tab...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      console.log('Sending message to content script...');
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractNutrition' });
      console.log('Received response:', response);

      if (!response?.success || !response?.data) {
        throw new Error('Failed to extract nutrition data');
      }

      setData(response.data);
      setActiveTab('preview');

      // Tải lại dữ liệu bôi vàng từ storage
      chrome.storage.local.get(['nutritionPreview'], (result) => {
        if (result.nutritionPreview) {
          setPreviewData(result.nutritionPreview);
          console.log('Updated nutrition preview:', result.nutritionPreview);
        }
      });

      // Create and download JSON file
      const json = JSON.stringify(response.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const domain = new URL(tab.url || '').hostname.replace('www.', '');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `nutrition-${domain}-${timestamp}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Hiển thị giá trị dinh dưỡng với nhãn người dùng và icon
  const renderNutritionValue = (key: string, value: number | null | string) => {
    const labels: Record<string, string> = {
      calories: 'Calories',
      protein: 'Protein',
      fat: 'Chất béo',
      carbs: 'Carbohydrates',
      fiber: 'Chất xơ',
      sugar: 'Đường',
      added_sugar: 'Đường bổ sung',
      cholesterol: 'Cholesterol',
      sodium: 'Natri',
      saturated_fat: 'Chất béo bão hòa',
      calcium: 'Canxi',
      iron: 'Sắt',
      amount_per: 'Khẩu phần'
    };
    
    const highlighted = previewData?.sourceInfo?.[key] ? true : false;
    
    if (value === null) return null;
    
    // Hiển thị đơn vị đo thích hợp
    const getUnit = (key: string) => {
      if (key === 'calories') return 'kcal';
      if (['protein', 'fat', 'carbs', 'fiber', 'sugar', 'added_sugar', 'saturated_fat'].includes(key)) return 'g';
      if (key === 'sodium' || key === 'cholesterol') return 'mg';
      if (key === 'calcium' || key === 'iron') return 'mg';
      return '';
    };

    // Kiểm tra giá trị có ý nghĩa
    const isValueMeaningful = (val: number | string | null) => {
      if (val === null || val === undefined || val === '') return false;
      if (typeof val === 'number' && val === 0) return false;
      // Kiểm tra trường hợp chuỗi số quá dài (lỗi)
      if (typeof val === 'string' && val.length > 15) return false;
      return true;
    };
    
    return (
      <Table.Tr key={key} style={highlighted ? { backgroundColor: 'rgba(255, 250, 225, 0.6)' } : {}}>
        <Table.Td style={{ padding: '6px 8px' }}>
          <Group gap="xs" wrap="nowrap">
            <ThemeIcon color={highlighted ? 'yellow' : getNutritionColor(key)} variant="light" size="sm" radius="xl" style={{ flexShrink: 0 }}>
              {getNutritionIcon(key)}
            </ThemeIcon>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Text size="sm" fw={500} truncate>{labels[key] || key}</Text>
              {highlighted && <Badge color="yellow" size="xs" variant="dot" mt={2}>Tìm thấy</Badge>}
            </div>
          </Group>
        </Table.Td>
        <Table.Td style={{ padding: '6px 4px', textAlign: 'right', minWidth: '85px' }}>
          <Group justify="flex-end" gap={2} wrap="nowrap">
            {isValueMeaningful(value) ? (
              <>
                <Text fw={600} size="sm" truncate style={{ maxWidth: '70px' }}>{value.toString()}</Text>
                <Text size="xs" c="dimmed" style={{ width: '15px', textAlign: 'left' }}>{getUnit(key)}</Text>
              </>
            ) : (
              <Text c="dimmed" size="xs" fs="italic">Không có</Text>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  };

  // Helpers cho UI
  const getNutritionColor = (key: string) => {
    if (['calories'].includes(key)) return 'red';
    if (['protein'].includes(key)) return 'blue';
    if (['fat', 'saturated_fat'].includes(key)) return 'orange';
    if (['carbs', 'fiber', 'sugar', 'added_sugar'].includes(key)) return 'green';
    if (['sodium', 'cholesterol', 'calcium', 'iron'].includes(key)) return 'violet';
    return 'gray';
  };

  const getNutritionIcon = (key: string) => {
    const icons = {
      calories: <IconFlame size={18} />,
      protein: <IconEgg size={18} />,
      fat: <IconCheese size={18} />,
      carbs: <IconBread size={18} />,
      fiber: <IconLeaf size={18} />,
      sugar: <IconApple size={18} />,
      added_sugar: <IconApple size={18} />,
      cholesterol: <IconHeartFilled size={18} />,
      sodium: <IconSalad size={18} />,
      saturated_fat: <IconCheese size={18} />,
      calcium: <IconScale size={18} />,
      iron: <IconChartBar size={18} />,
      amount_per: <IconScale size={18} />
    };
    return icons[key as keyof typeof icons] || <IconLeaf size={18} />;
  };
  
  // Thông báo thành công sau khi trích xuất
  const showSuccessNotification = () => {
    notifications.show({
      title: 'Trích xuất thành công',
      message: 'Dữ liệu dinh dưỡng đã được lưu và tải xuống',
      color: 'teal',
      icon: <IconCheck size="1.1rem" />,
      autoClose: 3000
    });
  };

  // Thông báo lỗi
  const showErrorNotification = (errorMsg: string) => {
    notifications.show({
      title: 'Lỗi trích xuất',
      message: errorMsg,
      color: 'red',
      icon: <IconAlertCircle size="1.1rem" />,
      autoClose: 4000
    });
  };
  
  // Tính độ đầy đủ của dữ liệu dinh dưỡng và đếm số lượng tìm thấy
  const calculateNutritionStats = () => {
    if (!previewData?.data) return { completeness: 0, foundCount: 0, highlightedCount: 0 };
    
    const totalFields = 12; // Tổng số trường dinh dưỡng có thể có
    let filledFields = 0;
    let highlightedCount = 0;
    
    // Đếm số trường có dữ liệu
    Object.entries(previewData.data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 0) {
        filledFields++;
        
        // Đếm số lượng trường được bôi vàng
        if (previewData.sourceInfo[key]) {
          highlightedCount++;
        }
      }
    });
    
    return { 
      completeness: (filledFields / totalFields) * 100,
      foundCount: filledFields,
      highlightedCount: highlightedCount
    };
  };
  
  // Lấy kết quả thống kê
  const nutritionStats = calculateNutritionStats();

  // Cập nhật UI cho nút extraction
  const handleExtraction = async () => {
    try {
      await extractNutrition();
      showSuccessNotification();
    } catch (err) {
      if (err instanceof Error) {
        showErrorNotification(err.message);
      } else {
        showErrorNotification('Có lỗi xảy ra trong quá trình trích xuất');
      }
    }
  };
  
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
      <Container p="xs" size="xs" style={{ maxWidth: '390px', width: '100%', backgroundColor: 'white' }}>
        {/* Sử dụng chiều cao auto để tránh khoảng trắng */}
        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', backgroundColor: 'white', minHeight: '0', overflow: 'auto' }}>
        <Stack gap="md" style={{ flex: '0 0 auto' }}>
          <Group justify="center">
            <ThemeIcon size="lg" color="teal" variant="light" radius="xl">
              <IconSalad size="1.5rem" stroke={1.5} />
            </ThemeIcon>
            <Title order={2} style={{ fontWeight: 800, color: '#2A7F62' }}>
              Nutrition Data
            </Title>
          </Group>
          
          <Tabs value={activeTab} onChange={setActiveTab} variant="pills" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
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
            </Tabs.List>

            <Tabs.Panel value="extract" style={{ flex: 1, paddingRight: '4px' }}>
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
            </Tabs.Panel>

            <Tabs.Panel value="preview" style={{ flex: 1, paddingRight: '4px' }}>
              <ScrollArea h={350} type="auto" offsetScrollbars overscrollBehavior="contain" scrollbarSize={6} scrollHideDelay={2500}>
                {previewData && (
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
                    </Card>



                    <Card withBorder mb="md" shadow="xs" style={{ overflow: 'hidden' }}>
                      <Box p="xs" pb={0} style={{ backgroundColor: '#F9FCFC' }}>
                        <Group justify="apart" mb="xs" wrap="nowrap">
                          <Text fw={600} size="sm" c="teal.7">Thông tin dinh dưỡng</Text>
                          <Badge size="sm" color="blue" variant="light">{Object.entries(previewData.data).filter(([_, v]) => v !== null && v !== '').length}</Badge>
                        </Group>
                      </Box>
                      <ScrollArea type="auto" scrollbarSize={6} scrollHideDelay={2500} offsetScrollbars>
                        <Table striped highlightOnHover withColumnBorders style={{ minWidth: '100%' }}>
                        <Table.Thead>
                          <Table.Tr style={{ backgroundColor: '#EDF2F7' }}>
                            <Table.Th style={{ width: '65%', padding: '6px 8px' }}>Dinh dưỡng</Table.Th>
                            <Table.Th style={{ width: '35%', textAlign: 'right', padding: '6px 8px' }}>Giá trị</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {/* Thông tin khẩu phần */}
                          {previewData.data.amount_per && (
                            <Table.Tr style={{ backgroundColor: '#F0F9FF' }}>
                              <Table.Td colSpan={2}>
                                <Group gap="xs" wrap="nowrap">
                                  <ThemeIcon color="blue" variant="light" size="sm" radius="xl">
                                    <IconScale size="0.8rem" />
                                  </ThemeIcon>
                                  <Text fw={500} size="sm" truncate>Khẩu phần: {previewData.data.amount_per}</Text>
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
                            previewData.data[key] !== undefined && renderNutritionValue(key, previewData.data[key])
                          )}
                          
                          {/* Chi tiết carbs */}
                          <Table.Tr style={{ backgroundColor: '#F0FFF4' }}>
                            <Table.Td colSpan={2}>
                              <Text size="xs" fw={600} c="green.8">CHI TIẾT CARBS</Text>
                            </Table.Td>
                          </Table.Tr>
                          {['fiber', 'sugar', 'added_sugar'].map(key => 
                            previewData.data[key] !== undefined && renderNutritionValue(key, previewData.data[key])
                          )}
                          
                          {/* Chi tiết chất béo */}
                          <Table.Tr style={{ backgroundColor: '#FFF5F5' }}>
                            <Table.Td colSpan={2}>
                              <Text size="xs" fw={600} c="red.8">CHI TIẾT CHẤT BÉO</Text>
                            </Table.Td>
                          </Table.Tr>
                          {['saturated_fat', 'cholesterol'].map(key => 
                            previewData.data[key] !== undefined && renderNutritionValue(key, previewData.data[key])
                          )}
                          
                          {/* Khoáng chất */}
                          <Table.Tr style={{ backgroundColor: '#F0F4FF' }}>
                            <Table.Td colSpan={2}>
                              <Text size="xs" fw={600} c="indigo.8">KHOÁNG CHẤT</Text>
                            </Table.Td>
                          </Table.Tr>
                          {['sodium', 'calcium', 'iron'].map(key => 
                            previewData.data[key] !== undefined && renderNutritionValue(key, previewData.data[key])
                          )}
                        </Table.Tbody>
                      </Table>
                      </ScrollArea>
                    </Card>

                    <Divider my="md" label="Phần tử được bôi vàng" labelPosition="center" />
                    
                    <Text fw={600} size="sm" mb="sm" c="orange.8">
                      Các phần tử được bôi vàng trên trang
                    </Text>
                    
                    {Object.entries(previewData.sourceInfo).length > 0 ? (
                      Object.entries(previewData.sourceInfo).map(([key, info]) => {
                        // Kiểm tra nếu textContent có quá dài hoặc trống
                        const displayedText = info.textContent && info.textContent.length > 0 
                          ? (info.textContent.length > 500 
                             ? info.textContent.substring(0, 500) + '...' 
                             : info.textContent)
                          : 'Không có nội dung văn bản';
                          
                        return (
                          <Paper key={key} p="xs" withBorder mb="xs" shadow="xs" style={{ borderColor: '#FEEBC8', backgroundColor: 'white' }}>
                            <Group>
                              <ThemeIcon color="yellow" variant="light" size="sm" radius="xl">
                                {getNutritionIcon(key)}
                              </ThemeIcon>
                              <Badge color="yellow" variant="light" radius="sm">{key}</Badge>
                              <Text size="xs" c="dimmed">{info.tagName}</Text>
                            </Group>
                            <Text size="sm" mt="xs" style={{ backgroundColor: 'rgba(255, 247, 214, 0.5)', padding: '4px', borderRadius: '4px' }}>
                              {displayedText}
                            </Text>
                          </Paper>
                        );
                      })
                    ) : (
                      <Text size="sm" c="dimmed" ta="center" py="lg">
                        Không tìm thấy phần tử được bôi vàng
                      </Text>
                    )}
                  </Box>
                )}
              </ScrollArea>
            </Tabs.Panel>
          </Tabs>
        </Stack>
        </div>
      </Container>
    </MantineProvider>
  );
}

export default App;
