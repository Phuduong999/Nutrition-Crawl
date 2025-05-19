import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Button, Loader, Paper, Group, ThemeIcon, Card, List, ScrollArea, 
         ActionIcon, Tooltip, Badge, Kbd, Checkbox, CopyButton, Divider, Stack } from '@mantine/core';
import { IconSalad, IconAlertCircle, IconCheck, IconChevronRight, 
         IconCopy, IconKeyboard, IconSettings, IconInfoCircle } from '@tabler/icons-react';
import { useHotkeys } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { trustedSources } from '../../config/trustedSources';
import type { NutritionData } from '../../types';

interface ExtractTabProps {
  loading: boolean;
  error: string | null;
  data: NutritionData | null;
  handleExtraction: (options?: { useHotkey?: boolean, sourceName?: string }) => Promise<boolean | void>;
  setActiveTab: (tab: string | null) => void;
  currentUrl?: string;
}

const ExtractTab: React.FC<ExtractTabProps> = ({ 
  loading, 
  error, 
  data, 
  handleExtraction,
  setActiveTab,
  currentUrl = ''
}) => {
  const [extractionSettings, setExtractionSettings] = useState({
    highlightElements: true,
    autoDownload: true,
    copyToClipboard: false,
    useOnlyTrustedSources: true
  });
  
  // Phát hiện nguồn tin cậy từ URL hiện tại
  const [detectedSource, setDetectedSource] = useState<string | null>(null);
  
  useEffect(() => {
    if (currentUrl) {
      try {
        const url = new URL(currentUrl);
        const hostname = url.hostname.replace('www.', '');
        
        // Kiểm tra xem hostname có trong danh sách nguồn tin cậy không
        const matchedSource = Object.keys(trustedSources).find(source => 
          hostname.includes(source));
        
        setDetectedSource(matchedSource || null);
      } catch (e) {
        setDetectedSource(null);
      }
    }
  }, [currentUrl]);
  
  // Các biến trạng thái cho hotkey
  const [hotkeysActivated, setHotkeysActivated] = useState(false);
  
  // Bôi vàng phần tử trích xuất (Ctrl+Alt+N)
  const handleHighlightElements = useCallback(() => {
    if (!hotkeysActivated) {
      notifications.show({
        title: 'Hotkey chưa được kích hoạt',
        message: 'Bạn cần nhấn Ctrl+Alt+B trước để kích hoạt trích xuất',
        color: 'yellow'
      });
      return;
    }
    
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0]?.id;
        if (!activeTabId) {
          notifications.show({
            title: 'Không tìm thấy tab hiện tại',
            message: 'Không thể xác định tab đang hoạt động',
            color: 'red'
          });
          return;
        }
        
        console.log('Đang gửi message tới content script', activeTabId);
        
        // Hiển thị thông báo đang thực hiện
        notifications.show({
          id: 'highlight-pending',
          title: 'Đang bôi vàng phần tử...',
          message: 'Vui lòng đợi trong giây lát',
          loading: true,
          autoClose: false,
          color: 'blue'
        });
        
        // Hàm thử gọi lại content script nếu inject rồi
        const tryHighlight = (tryCount = 0) => {
          // Nếu đã thử quá nhiều lần thì dừng
          if (tryCount >= 3) {
            notifications.hide('highlight-pending');
            notifications.show({
              title: 'Không thể kết nối',
              message: 'Không thể kết nối với content script sau nhiều lần thử. Hãy tải lại trang.',
              color: 'red'
            });
            return;
          }
          
          // Gọi content script
          chrome.tabs.sendMessage(
            activeTabId,
            { action: "highlightNutritionElements" },
            (_response) => {
              // Kiểm tra lỗi kết nối
              if (chrome.runtime.lastError) {
                console.error('Lỗi kết nối:', chrome.runtime.lastError.message);
                
                // Nếu là lần đầu có lỗi, thử inject content script
                if (tryCount === 0) {
                  console.log('Thử inject content script và gọi lại...');
                  // Yêu cầu inject content script
                  chrome.runtime.sendMessage(
                    { action: 'injectContentScript', tabId: activeTabId },
                    (injectResponse) => {
                      if (injectResponse?.success) {
                        console.log('Inject thành công, thử gọi lại...');
                        setTimeout(() => tryHighlight(tryCount + 1), 500);
                      } else {
                        notifications.hide('highlight-pending');
                        notifications.show({
                          title: 'Content script chưa sẵn sàng',
                          message: injectResponse?.error || 'Không thể tải content script. Hãy tải lại trang (F5).',
                          color: 'red'
                        });
                      }
                    }
                  );
                } else {
                  // Đã thử nhiều lần, chờ một chút và thử lại
                  setTimeout(() => tryHighlight(tryCount + 1), 1000);
                }
                return;
              }
              
              // Nếu thành công
              notifications.hide('highlight-pending');
              notifications.show({
                title: 'Bôi vàng phần tử',
                message: 'Các phần tử dinh dưỡng đã được bôi vàng trên trang',
                color: 'blue'
              });
            }
          );
        };
        
        // Bắt đầu thử
        tryHighlight(0);
      });
    } catch (error) {
      console.error('Lỗi highlight:', error);
      notifications.hide('highlight-pending');
      notifications.show({
        title: 'Lỗi xử lý',
        message: `${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
        color: 'red'
      });
    }
  }, [hotkeysActivated]);
  
  // Copy dữ liệu dinh dưỡng (Ctrl+Alt+M)
  const handleCopyNutritionData = useCallback(() => {
    if (!hotkeysActivated) {
      notifications.show({
        title: 'Hotkey chưa được kích hoạt',
        message: 'Bạn cần nhấn Ctrl+Alt+B trước để kích hoạt trích xuất',
        color: 'yellow'
      });
      return;
    }
    
    if (data) {
      try {
        const jsonData = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(jsonData)
          .then(() => {
            notifications.show({
              title: 'Sao chép thành công',
              message: 'Dữ liệu dinh dưỡng đã được sao chép vào clipboard',
              color: 'teal'
            });
          })
          .catch((err) => {
            console.error('Lỗi sao chép:', err);
            notifications.show({
              title: 'Lỗi sao chép',
              message: 'Không thể sao chép dữ liệu',
              color: 'red'
            });
          });
      } catch (error) {}
    } else {
      notifications.show({
        title: 'Chưa có dữ liệu',
        message: 'Hãy trích xuất dữ liệu trước khi sao chép',
        color: 'yellow'
      });
    }
  }, [data, hotkeysActivated]);
  
  // Kiểm tra trạng thái của content script
  const checkContentScriptStatus = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id;
      if (!activeTabId) {
        notifications.show({
          title: 'Không tìm thấy tab hiện tại',
          message: 'Không thể xác định tab đang hoạt động',
          color: 'red'
        });
        return;
      }

      // Hiển thị URL hiện tại để debug
      console.log('Kiểm tra content script cho tab:', tabs[0].url);
      
      // Sử dụng chrome.scripting API thay vì executeScript (đã deprecated)
      chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        func: () => {
          return document.documentElement.hasAttribute('data-nutrition-crawl-loaded');
        }
      }).then(results => {
        const isLoaded = results[0]?.result === true;
        
        if (isLoaded) {
          notifications.show({
            title: 'Content script OK',
            message: 'Content script đã được tải vào trang này. Có thể dùng các tính năng trích xuất.',
            color: 'green'
          });
        } else {
          // Thử inject script nếu chưa được tải
          chrome.runtime.sendMessage(
            { action: 'injectContentScript', tabId: activeTabId },
            (response) => {
              if (response?.success) {
                notifications.show({
                  title: 'Content script OK',
                  message: 'Content script đã được tải thành công. Giờ bạn có thể trích xuất dữ liệu.',
                  color: 'green'
                });
              } else {
                notifications.show({
                  title: 'Content script chưa sẵn sàng',
                  message: 'Không thể tải content script. Hãy tải lại trang (F5) và thử lại.',
                  color: 'orange'
                });
              }
            }
          );
        }
      }).catch(error => {
        console.error('Lỗi kiểm tra content script:', error);
        notifications.show({
          title: 'Không thể kiểm tra',
          message: `Lỗi: ${error.message || 'không xác định'}. Có thể cần cấp quyền hoặc trang không hỗ trợ.`,
          color: 'red'
        });
      });
    });
  }, []);
  
  // Kích hoạt trích xuất (Ctrl+Alt+B) - HOT KEY CHÍNH
  const handleActivateExtraction = useCallback(() => {
    try {
      // Kiểm tra URL hiện tại để debug
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        console.log('Hiện tại đang ở tab:', currentTab?.url);
        
        if (!currentTab || !currentTab.url) {
          notifications.show({
            title: 'Không tìm thấy tab hiện tại',
            message: 'Không thể xác định được tab đang hoạt động',
            color: 'red'
          });
          return;
        }
        
        // Gọi background script để inject content script thay vì tự inject
        const tabId = currentTab.id!;
        
        // Hiển thị thông báo đang xử lý
        notifications.show({
          id: 'loading-script',
          title: 'Đang tải content script...',
          message: 'Vui lòng đợi trong giây lát...',
          loading: true,
          autoClose: false,
          color: 'blue'
        });
        
        chrome.runtime.sendMessage(
          { action: 'injectContentScript', tabId },
          (response) => {
            // Đóng thông báo loading
            notifications.hide('loading-script');
            
            if (response?.success) {
              console.log('Injection content script thành công');
              
              // Kích hoạt các hotkey
              setHotkeysActivated(true);
              
              // Thực hiện trích xuất dữ liệu
              handleExtraction();
              
              notifications.show({
                title: 'Đã kích hoạt hotkey',
                message: 'Bây giờ bạn có thể sử dụng các phím tắt Ctrl+Alt+N hoặc Ctrl+Alt+M',
                color: 'blue'
              });
            } else {
              console.error('Không thể inject content script:', response?.error || 'Lỗi không xác định');
              
              notifications.show({
                title: 'Content script chưa sẵn sàng',
                message: 'Không thể tải content script. Hãy tải lại trang (F5) và thử lại.',
                color: 'red'
              });
              
              // Không kích hoạt hoãc trích xuất nếu lỗi
              setHotkeysActivated(false);
            }
          }
        );
      });
    } catch (error) {
      console.error('Lỗi kích hoạt trích xuất:', error);
      notifications.show({
        title: 'Lỗi kích hoạt',
        message: `${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
        color: 'red'
      });
      setHotkeysActivated(false);
    }
  }, [handleExtraction]);
  
  // Đăng ký các hotkey
  useHotkeys([
    ['mod+alt+N', handleHighlightElements],
    ['mod+alt+M', handleCopyNutritionData],
    ['mod+alt+B', handleActivateExtraction],
  ]);
  return (
    <ScrollArea h={300} type="auto" scrollbarSize={6} scrollHideDelay={1000}>
      <Box style={{ padding: '0 4px' }}>
        {detectedSource && (
          <Paper p="xs" withBorder mb="md" style={{ borderColor: '#D8F3DC', backgroundColor: '#F0FFF4' }}>
            <Group wrap="nowrap">
              <ThemeIcon color="green" variant="light" size="md">
                <IconCheck size="1rem" />
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Text size="sm" fw={500}>
                  Đã phát hiện nguồn tin cậy: <Badge color="green">{detectedSource}</Badge>
                </Text>
                <Text size="xs" c="dimmed">
                  Sử dụng các phím tắt để trích xuất thông tin.
                </Text>
              </Box>
            </Group>
          </Paper>
        )}

        <Text size="sm" c="dimmed" mb="md" ta="center">
          Nhấn nút bên dưới để trích xuất dữ liệu dinh dưỡng từ trang web hiện tại.
        </Text>
        
        <Group gap="xs">
          <Button
            onClick={() => handleExtraction()}
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
          
          <Tooltip label="Cài đặt trích xuất">
            <ActionIcon 
              size="lg" 
              variant="default" 
              onClick={() => setActiveTab('settings')}
              disabled={loading}
            >
              <IconSettings size="1.1rem" />
            </ActionIcon>
          </Tooltip>
        </Group>
        
        <Group justify="space-between" mt="xs">
          <Stack gap={0}>
            <Tooltip label="Bôi vàng các phần tử dinh dưỡng">
              <Group gap="xs">
                <IconKeyboard size="0.9rem" stroke={1.5} color="gray" />
                <Text size="xs" c="dimmed"><Kbd>Ctrl</Kbd>+<Kbd>Alt</Kbd>+<Kbd>N</Kbd></Text>
              </Group>
            </Tooltip>
            <Tooltip label="Sao chép dữ liệu dinh dưỡng">
              <Group gap="xs">
                <IconKeyboard size="0.9rem" stroke={1.5} color="gray" />
                <Text size="xs" c="dimmed"><Kbd>Ctrl</Kbd>+<Kbd>Alt</Kbd>+<Kbd>M</Kbd></Text>
              </Group>
            </Tooltip>
            <Tooltip label="Kích hoạt trích xuất (Bắc buộc phải nhấn trước)">
              <Group gap="xs">
                <IconKeyboard size="0.9rem" stroke={1.5} color="gray" />
                <Text size="xs" c="dimmed" fw={700} style={{ color: '#e74c3c' }}><Kbd>Ctrl</Kbd>+<Kbd>Alt</Kbd>+<Kbd>B</Kbd></Text>
              </Group>
            </Tooltip>
          </Stack>
          
          <Button 
            variant="subtle" 
            size="xs"
            onClick={checkContentScriptStatus}
            leftSection={<IconInfoCircle size="0.8rem" stroke={1.5} />}
            style={{ backgroundColor: 'transparent' }}
          >
            Kiểm tra kết nối
          </Button>
        </Group>

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
            <Group align="flex-start">
              <ThemeIcon color="teal" variant="light" size="md" radius="xl">
                <IconCheck size="1rem" />
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Text size="sm" fw={500} c="teal.8">
                  Trích xuất thành công!
                </Text>
                <Text size="xs" c="dimmed" mb="xs">
                  {extractionSettings.autoDownload ? 'File JSON đã được tải xuống.' : 'Dữ liệu đã được xử lý.'}
                </Text>
                
                {/* Hiển thị một số thông tin dinh dưỡng cơ bản */}
                {data && (
                  <Stack gap="xs" mt="xs">
                    <Group gap="xs">
                      <Badge size="sm" color="blue">Calories: {data.calories || 'N/A'}</Badge>
                      <Badge size="sm" color="green">Protein: {data.protein || 'N/A'}g</Badge>
                      <Badge size="sm" color="yellow">Carbs: {data.carbs || 'N/A'}g</Badge>
                      <Badge size="sm" color="red">Fat: {data.fat || 'N/A'}g</Badge>
                    </Group>
                    
                    <Group gap="xs">
                      <CopyButton value={JSON.stringify(data, null, 2)}>
                        {({ copied, copy }) => (
                          <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconCopy size="0.9rem" />}
                            onClick={copy}
                            color={copied ? 'teal' : 'blue'}
                          >
                            {copied ? 'Đã sao chép' : 'Sao chép dữ liệu'}
                          </Button>
                        )}
                      </CopyButton>
                      
                      <Button 
                        variant="subtle" 
                        color="teal" 
                        size="xs"
                        rightSection={<IconChevronRight size={14} />}
                        onClick={() => setActiveTab('preview')}
                      >
                        Xem chi tiết
                      </Button>
                    </Group>
                  </Stack>
                )}
              </Box>
            </Group>
          </Card>
        )}
        
        <Card withBorder mt="lg" p="md" style={{ backgroundColor: '#F9FAFB' }}>
          <Text size="sm" fw={500} mb="xs">Hướng dẫn sử dụng</Text>
          <Divider my="xs" />
          <List size="xs" spacing="xs" c="dimmed">
            <List.Item icon={<Text c="blue">1</Text>}>Truy cập trang có thông tin dinh dưỡng</List.Item>
            <List.Item icon={<Text c="blue">2</Text>}>Nhấn phím tắt <Kbd fw={700} style={{ color: '#e74c3c' }}>Ctrl</Kbd>+<Kbd fw={700} style={{ color: '#e74c3c' }}>Alt</Kbd>+<Kbd fw={700} style={{ color: '#e74c3c' }}>B</Kbd> để kích hoạt trích xuất</List.Item>
            <List.Item icon={<Text c="blue">3</Text>}>Dùng <Kbd>Ctrl</Kbd>+<Kbd>Alt</Kbd>+<Kbd>N</Kbd> để bôi vàng phần tử dinh dưỡng</List.Item>
            <List.Item icon={<Text c="blue">4</Text>}>Dùng <Kbd>Ctrl</Kbd>+<Kbd>Alt</Kbd>+<Kbd>M</Kbd> để sao chép dữ liệu</List.Item>
            <List.Item icon={<Text c="blue">5</Text>}>Hoặc nhấp nút "Trích xuất dữ liệu dinh dưỡng"</List.Item>
          </List>
          
          <Divider my="xs" label="Tùy chỉnh" labelPosition="center" />
          
          <Stack gap="xs">
            <Checkbox
              label="Tự động bôi vàng các phần tử"
              checked={extractionSettings.highlightElements}
              onChange={(e) => setExtractionSettings({...extractionSettings, highlightElements: e.currentTarget.checked})}
              size="xs"
            />
            <Checkbox
              label="Tự động tải file JSON"
              checked={extractionSettings.autoDownload}
              onChange={(e) => setExtractionSettings({...extractionSettings, autoDownload: e.currentTarget.checked})}
              size="xs"
            />
            <Checkbox
              label="Tự động sao chép dữ liệu vào clipboard"
              checked={extractionSettings.copyToClipboard}
              onChange={(e) => setExtractionSettings({...extractionSettings, copyToClipboard: e.currentTarget.checked})}
              size="xs"
            />
            <Checkbox
              label="Chỉ sử dụng nguồn tin cậy"
              checked={extractionSettings.useOnlyTrustedSources}
              onChange={(e) => setExtractionSettings({...extractionSettings, useOnlyTrustedSources: e.currentTarget.checked})}
              size="xs"
            />
          </Stack>
        </Card>
      </Box>
    </ScrollArea>
  );
};

export default ExtractTab;
