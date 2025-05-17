import type { NutritionData } from '../types';

// Hàm lấy màu cho từng loại thông tin dinh dưỡng
export const getNutritionColor = (key: string): string => {
  if (['calories'].includes(key)) return 'red';
  if (['protein'].includes(key)) return 'blue';
  if (['fat', 'saturated_fat'].includes(key)) return 'orange';
  if (['carbs', 'fiber', 'sugar', 'added_sugar'].includes(key)) return 'green';
  if (['sodium', 'cholesterol', 'calcium', 'iron'].includes(key)) return 'violet';
  return 'gray';
};

// Tính độ đầy đủ của dữ liệu dinh dưỡng và đếm số lượng tìm thấy
export const calculateNutritionStats = (previewData: { data: NutritionData, sourceInfo: Record<string, any> } | null) => {
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

// Hàm kiểm tra giá trị dinh dưỡng có ý nghĩa
export const isValueMeaningful = (val: number | string | null | undefined): boolean => {
  if (val === null || val === undefined || val === '') return false;
  if (typeof val === 'number' && val === 0) return false;
  // Kiểm tra trường hợp chuỗi số quá dài (lỗi)
  if (typeof val === 'string' && val.length > 15) return false;
  return true;
};

// Hàm lấy đơn vị đo cho loại dinh dưỡng
export const getNutritionUnit = (key: string): string => {
  if (key === 'calories') return 'kcal';
  if (['protein', 'fat', 'carbs', 'fiber', 'sugar', 'added_sugar', 'saturated_fat'].includes(key)) return 'g';
  if (key === 'sodium' || key === 'cholesterol') return 'mg';
  if (key === 'calcium' || key === 'iron') return 'mg';
  return '';
};

// Labels cho các giá trị dinh dưỡng
export const nutritionLabels: Record<string, string> = {
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
