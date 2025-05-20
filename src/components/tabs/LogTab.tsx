import React, { useEffect, useState } from 'react';
import {
  Card,
  Text,
  Tabs,
  Badge,
  ScrollArea,
  Group,
  Stack,
  Code,
  ActionIcon,
  Tooltip,
  Box
} from '@mantine/core';
import { IconRefresh, IconTrash, IconDownload } from '@tabler/icons-react';
import { useLogStore, type LogEntry } from '../../store/logStore';

interface LogTabProps {
  setActiveTab?: (value: string | null) => void;
}

const LogTab: React.FC<LogTabProps> = () => {
  const { logs, clearLogs, getRecentLogs } = useLogStore();
  const [activeTab, setActiveTab] = useState<string | null>('url');
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  // Cập nhật log mới nhất từ chrome.storage theo interval
  useEffect(() => {
    const fetchAndUpdateLogs = () => {
      chrome.storage.local.get(['log_latest'], (result) => {
        if (result.log_latest && result.log_latest.timestamp) {
          const newLog = result.log_latest;
          // Thêm log mới vào store
          useLogStore.getState().addLog({
            type: newLog.type as LogEntry['type'],
            message: newLog.message,
            data: newLog.data || newLog.error
          });
          setUpdatedAt(new Date());
        }
      });
    };

    // Cập nhật log mỗi 1 giây
    const intervalId = setInterval(fetchAndUpdateLogs, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Cập nhật recentLogs khi logs thay đổi hoặc tab thay đổi
  useEffect(() => {
    if (activeTab === 'all') {
      setRecentLogs(getRecentLogs(100));
    } else {
      setRecentLogs(logs.filter(log => log.type === activeTab));
    }
  }, [logs, activeTab, getRecentLogs, updatedAt]);

  // Xuất logs ra file
  const exportLogs = () => {
    const logsJson = JSON.stringify(logs, null, 2);
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrition-crawl-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Lấy màu badge tương ứng với loại log
  const getLogTypeBadgeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'url':
        return 'blue';
      case 'xpath':
        return 'green';
      case 'extraction':
        return 'orange';
      case 'error':
        return 'red';
      case 'info':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Render nội dung log
  const renderLogContent = (log: LogEntry) => {
    // Hiển thị message
    return (
      <Stack gap="xs">
        <Text size="sm">{log.message}</Text>
        
        {/* Hiển thị dữ liệu kèm theo nếu có */}
        {log.data && (
          <ScrollArea h={log.type === 'xpath' ? 100 : 50} scrollbarSize={6} type="auto" scrollHideDelay={2500}>
            <Code block style={{ whiteSpace: 'pre-wrap' }}>
              {typeof log.data === 'object' 
                ? JSON.stringify(log.data, null, 2)
                : log.data.toString()}
            </Code>
          </ScrollArea>
        )}
      </Stack>
    );
  };

  // Render danh sách log
  const renderLogs = () => {
    if (recentLogs.length === 0) {
      return (
        <Card withBorder p="md" radius="md" bg="white">
          <Text ta="center" c="dimmed">Không có dữ liệu log</Text>
        </Card>
      );
    }

    return recentLogs.map((log, index) => (
      <Card key={log.timestamp + index} withBorder p="md" radius="md" my="xs" bg="white">
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            <Badge color={getLogTypeBadgeColor(log.type)}>
              {log.type.toUpperCase()}
            </Badge>
            <Text size="xs" c="dimmed">{formatTime(log.timestamp)}</Text>
          </Group>
        </Group>
        {renderLogContent(log)}
      </Card>
    ));
  };

  // Số lượng log theo loại
  const urlLogCount = logs.filter(log => log.type === 'url').length;
  const xpathLogCount = logs.filter(log => log.type === 'xpath').length;
  const extractionLogCount = logs.filter(log => log.type === 'extraction').length;
  const errorLogCount = logs.filter(log => log.type === 'error').length;

  return (
    <Box style={{ height: '350px', overflow: 'hidden', padding: '0 4px' }}>
      <ScrollArea style={{ height: '100%' }} type="auto" scrollbarSize={6} scrollHideDelay={2500}>
        <Card withBorder radius="md" p="md" bg="white" mb="md">
          <Card.Section py="md" px="md">
            <Group justify="space-between">
              <Text fw={500}>Log Hoạt Động</Text>
              <Group gap="xs">
                <Tooltip label="Làm mới">
                  <ActionIcon onClick={() => setUpdatedAt(new Date())}>
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Xóa tất cả log">
                  <ActionIcon color="red" onClick={clearLogs}>
                    <IconTrash size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Xuất log ra file">
                  <ActionIcon color="blue" onClick={exportLogs}>
                    <IconDownload size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Card.Section>

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="url" leftSection={<Badge size="xs" p={0} color="blue">{urlLogCount}</Badge>}>
                URL
              </Tabs.Tab>
              <Tabs.Tab value="xpath" leftSection={<Badge size="xs" p={0} color="green">{xpathLogCount}</Badge>}>
                XPath
              </Tabs.Tab>
              <Tabs.Tab value="extraction" leftSection={<Badge size="xs" p={0} color="orange">{extractionLogCount}</Badge>}>
                Trích xuất
              </Tabs.Tab>
              <Tabs.Tab value="error" leftSection={<Badge size="xs" p={0} color="red">{errorLogCount}</Badge>}>
                Lỗi
              </Tabs.Tab>
              <Tabs.Tab value="all">
                Tất cả
              </Tabs.Tab>
            </Tabs.List>

            <Box mt="md">
              {renderLogs()}
            </Box>
          </Tabs>
          
          <Group justify="space-between" mt="md">
            <Text size="xs" c="dimmed">
              Cập nhật lần cuối: {updatedAt.toLocaleTimeString('vi-VN')}
            </Text>
            <Text size="xs" c="dimmed">
              Tổng số log: {logs.length}
            </Text>
          </Group>
        </Card>
      </ScrollArea>
    </Box>
  );
};

export default LogTab;
