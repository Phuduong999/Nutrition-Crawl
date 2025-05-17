import { useState, useEffect } from 'react';
import type { NutritionData, NutritionPreview } from '../types';
import { showSuccessNotification, showErrorNotification } from '../components/common/NotificationService';

export const useNutritionExtractor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NutritionData | null>(null);
  const [previewData, setPreviewData] = useState<NutritionPreview | null>(null);
  
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

      return true;
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật UI cho nút extraction với xử lý thông báo
  const handleExtraction = async () => {
    try {
      await extractNutrition();
      showSuccessNotification();
      return true;
    } catch (err) {
      if (err instanceof Error) {
        showErrorNotification(err.message);
      } else {
        showErrorNotification('Có lỗi xảy ra trong quá trình trích xuất');
      }
      return false;
    }
  };

  return {
    loading,
    error,
    data,
    previewData,
    extractNutrition,
    handleExtraction
  };
};
