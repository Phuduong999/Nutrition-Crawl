import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Button, Loader, Paper, Group, ThemeIcon, Card, List, ScrollArea, 
         Badge, Kbd, Checkbox, CopyButton, Divider, Stack } from '@mantine/core';
import { IconSalad, IconAlertCircle, IconCheck, IconChevronRight, 
         IconCopy } from '@tabler/icons-react';
import { useHotkeys, useOs } from '@mantine/hooks';
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
  
  // Hàm chuẩn bị kết nối với content script trước khi trích xuất
  const prepareForExtraction = useCallback(async () => {
    try {
      // Hiển thị thông báo đang chuẩn bị
      notifications.show({
        id: 'preparation-status',
        title: 'Đang chuẩn bị content script...',
        message: 'Vui lòng đợi trong giây lát',
        loading: true,
        autoClose: false,
        color: 'blue'
      });
      
      // Lấy tab hiện tại
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTabId = activeTab?.id;
      
      if (!activeTabId) {
        throw new Error('Không tìm thấy tab đang hoạt động');
      }
      
      // LUÔN inject content script trước khi làm bất cứ điều gì khác
      notifications.update({
        id: 'preparation-status',
        loading: true,
        message: 'Đang tiêm content script...',
      });
      
      // Gọi background script để inject
      const injectResult = await new Promise<{success: boolean, error?: string}>(resolve => {
        chrome.runtime.sendMessage(
          { action: 'injectContentScript', tabId: activeTabId, force: true },
          response => {
            if (chrome.runtime.lastError) {
              console.error('Lỗi inject:', chrome.runtime.lastError.message);
              resolve({ success: false, error: chrome.runtime.lastError.message });
              return;
            }
            resolve(response || { success: false, error: 'Không nhận được phản hồi' });
          }
        );
      });
      
      console.log('Kết quả inject:', injectResult);
      
      if (!injectResult.success) {
        notifications.hide('preparation-status');
        notifications.show({
          title: 'Không thể tải content script',
          message: injectResult.error || 'Lỗi không xác định khi tải content script',
          color: 'red'
        });
        return false;
      }
      
      // Đợi một chút để content script khởi động hoàn tất
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Kiểm tra xem content script đã được tải đúng cách chưa
      const scriptResult = await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        func: () => document.documentElement.hasAttribute('data-nutrition-crawl-loaded')
      });
      
      const isContentScriptLoaded = scriptResult[0]?.result === true;
      console.log('Content script đã được tải:', isContentScriptLoaded);
      
      if (!isContentScriptLoaded) {
        throw new Error('Content script không được tải đúng cách. Thử tải lại trang và thử lại.');
      }
      
      // Sử dụng cơ chế proxy qua background script để kiểm tra kết nối
      console.log('Kiểm tra kết nối với content script qua background proxy...');
      
      try {
        // Gửi ping qua background để proxy tới content script
        const pingResult = await Promise.race([
          new Promise<{success: boolean, data?: any, error?: string}>(resolve => {
            // Yêu cầu background script proxy tin nhắn tới content script
            chrome.runtime.sendMessage(
              { 
                action: 'proxy_to_content_script', 
                tabId: activeTabId,
                proxyRequest: { action: 'ping' }
              },
              response => {
                if (chrome.runtime.lastError) {
                  console.error('Lỗi proxy ping:', chrome.runtime.lastError.message);
                  resolve({ success: false, error: chrome.runtime.lastError.message });
                  return;
                }
                resolve(response || { success: false, error: 'Không nhận được phản hồi từ background' });
              }
            );
          }),
          new Promise<{success: boolean, error: string}>(resolve => 
            setTimeout(() => resolve({ success: false, error: 'Hết thời gian chờ phản hồi' }), 3000)
          )
        ]);
        
        console.log('Kết quả ping qua proxy:', pingResult);
        
        if (!pingResult.success) {
          throw new Error(pingResult.error || 'Không thể liên lạc với content script');
        }
      } catch (err) {
        console.error('Lỗi kết nối với content script:', err);
        notifications.hide('preparation-status');
        notifications.show({
          title: 'Lỗi kết nối',
          message: 'Không thể kết nối với content script. Hãy tải lại trang và thử lại.',
          color: 'red'
        });
        return false;
      }
      
      // Hoàn tất chuẩn bị
      notifications.hide('preparation-status');
      notifications.show({
        title: 'Kết nối thành công',
        message: 'Content script đã sẵn sàng cho trích xuất dữ liệu',
        color: 'green',
        autoClose: true
      });
      
      return true;
    } catch (error) {
      console.error('Lỗi trong quá trình chuẩn bị:', error);
      notifications.hide('preparation-status');
      notifications.show({
        title: 'Lỗi chuẩn bị',
        message: error instanceof Error ? error.message : 'Lỗi không xác định',
        color: 'red'
      });
      return false;
    }
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
  
  // Phát hiện hệ điều hành của người dùng để hiển thị hướng dẫn phím tắt phù hợp
  const os = useOs();
  const isMacOS = os === 'macos';
  
  // Đăng ký các hotkey (hỗ trợ cả Windows và macOS)
  // Trên Windows: Ctrl+Alt+Key
  // Trên macOS: ⌘ Command+Shift+Key (để tránh xung đột với Chrome)
  useHotkeys([
    // Bôi vàng các thành phần dinh dưỡng
    ['mod+alt+N', handleHighlightElements],
    ['ctrl+alt+N', handleHighlightElements], // Windows
    ['meta+shift+N', handleHighlightElements], // macOS - Command+Shift+N
    
    // Sao chép dữ liệu dinh dưỡng
    ['mod+alt+M', handleCopyNutritionData],
    ['ctrl+alt+M', handleCopyNutritionData], // Windows
    ['meta+shift+M', handleCopyNutritionData], // macOS - Command+Shift+M
    
    // Kích hoạt trích xuất
    ['mod+alt+B', handleActivateExtraction],
    ['ctrl+alt+B', handleActivateExtraction], // Windows
    ['meta+shift+B', handleActivateExtraction], // macOS - Command+Shift+B
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
                  Sử dụng phím tắt để trích xuất nhanh thông tin dinh dưỡng
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
            onClick={async () => {
              const ready = await prepareForExtraction();
              if (ready) {
                handleExtraction();
              }
            }}
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
          <Text size="sm" fw={500} mb="xs">Hướng dẫn sử dụng phím tắt</Text>
          <Divider my="xs" />
          <List size="xs" spacing="xs" c="dimmed">
            <List.Item icon={<Text c="blue">1</Text>}>Truy cập trang có thông tin dinh dưỡng</List.Item>
            {isMacOS ? (
              <>
                <List.Item icon={<Text c="blue">2</Text>}>Nhấn phím tắt <Kbd fw={700} style={{ color: '#e74c3c' }}>⌘</Kbd>+<Kbd fw={700} style={{ color: '#e74c3c' }}>Shift</Kbd>+<Kbd fw={700} style={{ color: '#e74c3c' }}>B</Kbd> để kích hoạt trích xuất</List.Item>
                <List.Item icon={<Text c="blue">3</Text>}>Dùng <Kbd>⌘</Kbd>+<Kbd>Shift</Kbd>+<Kbd>N</Kbd> để bôi vàng phần tử dinh dưỡng</List.Item>
                <List.Item icon={<Text c="blue">4</Text>}>Dùng <Kbd>⌘</Kbd>+<Kbd>Shift</Kbd>+<Kbd>M</Kbd> để sao chép dữ liệu</List.Item>
              </>
            ) : (
              <>
                <List.Item icon={<Text c="blue">2</Text>}>Nhấn phím tắt <Kbd fw={700} style={{ color: '#e74c3c' }}>Ctrl</Kbd>+<Kbd fw={700} style={{ color: '#e74c3c' }}>Alt</Kbd>+<Kbd fw={700} style={{ color: '#e74c3c' }}>B</Kbd> để kích hoạt trích xuất</List.Item>
                <List.Item icon={<Text c="blue">3</Text>}>Dùng <Kbd>Ctrl</Kbd>+<Kbd>Alt</Kbd>+<Kbd>N</Kbd> để bôi vàng phần tử dinh dưỡng</List.Item>
                <List.Item icon={<Text c="blue">4</Text>}>Dùng <Kbd>Ctrl</Kbd>+<Kbd>Alt</Kbd>+<Kbd>M</Kbd> để sao chép dữ liệu</List.Item>
              </>
            )}
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
