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
