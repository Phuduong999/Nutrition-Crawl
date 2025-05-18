import { useState, useEffect } from 'react';

// Hook để lưu và đọc dữ liệu từ chrome.storage.local
export function useChromeStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Đọc dữ liệu từ storage khi component được mount
  useEffect(() => {
    const getStoredValue = async () => {
      try {
        setIsLoading(true);
        const result = await chrome.storage.local.get(key);
        
        if (result[key] !== undefined) {
          console.log(`Loaded from storage: ${key}`, result[key]);
          setStoredValue(result[key]);
        } else {
          console.log(`No stored data for ${key}, using initial value`, initialValue);
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.error(`Error reading from storage: ${key}`, error);
        setStoredValue(initialValue);
      } finally {
        setIsLoading(false);
      }
    };

    getStoredValue();
  }, [key]);

  // Lưu giá trị vào storage mỗi khi storedValue thay đổi
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      // Cho phép giá trị là một function như setState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Lưu vào state và storage
      setStoredValue(valueToStore);
      
      console.log(`Saving to storage: ${key}`, valueToStore);
      await chrome.storage.local.set({ [key]: valueToStore });
    } catch (error) {
      console.error(`Error saving to storage: ${key}`, error);
    }
  };

  // Xóa giá trị trong storage
  const removeValue = async () => {
    try {
      setStoredValue(initialValue);
      await chrome.storage.local.remove(key);
      console.log(`Removed from storage: ${key}`);
    } catch (error) {
      console.error(`Error removing from storage: ${key}`, error);
    }
  };

  return { storedValue, setValue, removeValue, isLoading };
}
