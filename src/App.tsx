import { useState } from 'react';
import { MantineProvider, Button, Container, Text, Paper, Stack } from '@mantine/core';
import type { NutritionData } from './config/trustedSources';
import '@mantine/core/styles.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NutritionData | null>(null);

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

  return (
    <MantineProvider>
      <Container p="md" size="xs">
        <Stack>
          <Text size="xl" fw={700} ta="center">
            Nutrition Data Extractor
          </Text>

          <Button
            onClick={extractNutrition}
            disabled={loading}
            loading={loading}
          >
            {loading ? 'Extracting...' : 'Extract Nutrition'}
          </Button>

          {error && (
            <Paper p="sm" bg="red.1" c="red.8">
              <Text size="sm">{error}</Text>
            </Paper>
          )}

          {data && !error && (
            <Paper p="sm" bg="green.1">
              <Text size="sm" c="green.8">
                Data extracted successfully! JSON file has been downloaded.
              </Text>
            </Paper>
          )}
        </Stack>
      </Container>
    </MantineProvider>
  );
}

export default App;
