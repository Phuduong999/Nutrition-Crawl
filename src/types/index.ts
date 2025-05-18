// Interface cho dữ liệu phần tử được bôi vàng
export interface SourceElementInfo {
  tagName: string;
  textContent: string;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface NutritionPreview {
  url: string;
  title: string;
  timestamp: string;
  data: NutritionData;
  sourceInfo: Record<string, SourceElementInfo>;
}

// Import and re-export the NutritionData type from the original location
import type { NutritionData } from '../config/trustedSources';
export type { NutritionData };

// Interface cho tính năng Excel Import
export interface ExcelRow {
  url: string;              // Từ cột F (trusted source)
  extractedData: {
    // Các trường dữ liệu mapping với cột K-T
    columnK: string | null;
    columnL: string | null;
    columnM: string | null;
    columnN: string | null;
    columnO: string | null;
    columnP: string | null;
    columnQ: string | null;
    columnR: string | null;
    columnS: string | null;
    columnT: string | null;
    [key: string]: string | null;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// Cấu trúc dữ liệu XPath mapping
export interface XPathMapping {
  field: string;       // Tên trường (K, L, M...)
  xpath: string;       // XPath để trích xuất
  columnIndex: number; // Index của cột tương ứng (K=10, L=11...)
  description?: string; // Mô tả về trường dữ liệu
}
