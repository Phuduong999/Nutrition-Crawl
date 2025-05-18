/**
 * LogStore - Lưu trữ và quản lý các log trong extension
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LogEntry {
  timestamp: number;
  type: 'url' | 'xpath' | 'extraction' | 'error' | 'info';
  message: string;
  data?: any;
}

interface LogState {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'timestamp'>) => void;
  clearLogs: () => void;
  getLogsByType: (type: LogEntry['type']) => LogEntry[];
  getRecentLogs: (count: number) => LogEntry[];
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: [],
      
      addLog: (entry) => set((state) => {
        const newLog: LogEntry = {
          ...entry,
          timestamp: Date.now()
        };
        
        // Giới hạn số lượng log để tránh quá tải bộ nhớ
        const updatedLogs = [newLog, ...state.logs].slice(0, 1000);
        return { logs: updatedLogs };
      }),
      
      clearLogs: () => set({ logs: [] }),
      
      getLogsByType: (type) => {
        return get().logs.filter(log => log.type === type);
      },
      
      getRecentLogs: (count) => {
        return get().logs.slice(0, count);
      }
    }),
    {
      name: 'nutrition-crawl-logs',
    }
  )
);

/**
 * Logger function để sử dụng trong các content script
 */
export const logger = {
  url: (message: string, data?: any) => {
    console.log(`[URL] ${message}`, data);
    // Lưu log vào chrome.storage cho background/popup script sử dụng
    chrome.storage.local.set({
      ['log_latest']: {
        type: 'url',
        message,
        data,
        timestamp: Date.now()
      }
    });
  },
  
  xpath: (message: string, data?: any) => {
    console.log(`[XPATH] ${message}`, data);
    chrome.storage.local.set({
      ['log_latest']: {
        type: 'xpath',
        message,
        data,
        timestamp: Date.now()
      }
    });
  },
  
  extraction: (message: string, data?: any) => {
    console.log(`[EXTRACTION] ${message}`, data);
    chrome.storage.local.set({
      ['log_latest']: {
        type: 'extraction',
        message,
        data,
        timestamp: Date.now()
      }
    });
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    chrome.storage.local.set({
      ['log_latest']: {
        type: 'error',
        message,
        error: error?.toString() || '',
        timestamp: Date.now()
      }
    });
  },
  
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data);
    chrome.storage.local.set({
      ['log_latest']: {
        type: 'info',
        message,
        data,
        timestamp: Date.now()
      }
    });
  }
};
