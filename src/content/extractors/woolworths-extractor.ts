/**
 * Woolworths-specific nutrition data extractor
 */

import { defaultNutritionData } from '../../config/trustedSources';
import type { NutritionData } from '../../config/trustedSources';
import type { NutritionExtractor, ExtractionResult, ExtractionSourceMap } from '../types';
import { logger } from '../utils';

/**
 * Extractor dành riêng cho trang Woolworths
 */
export class WoolworthsExtractor implements NutritionExtractor {
  /**
   * Kiểm tra xem extractor có thể xử lý phần tử này không
   */
  canExtract(element: Element): boolean {
    // Kiểm tra xem có phải trang Woolworths không
    return (
      window.location.hostname.includes('woolworths.com.au') ||
      element.innerHTML.includes('nutritional-info_component') ||
      element.querySelector('.nutritional-info_component_nutritional-info-panel') !== null
    );
  }
  
  /**
   * Trích xuất dữ liệu dinh dưỡng từ trang Woolworths
   */
  extract(element: Element): ExtractionResult {
    logger.info('Bắt đầu trích xuất dữ liệu dinh dưỡng từ Woolworths');
    
    const data = { ...defaultNutritionData };
    const sourceMap: ExtractionSourceMap = {};
    
    try {
      // Tìm tất cả các hàng dinh dưỡng
      const nutritionRows = element.querySelectorAll('ul[class*="nutrition-row"]');
      logger.info(`Tìm thấy ${nutritionRows.length} hàng dữ liệu dinh dưỡng`);
      
      if (nutritionRows.length === 0) {
        return { data: null, sourceMap: {} };
      }
      
      // Tìm thông tin về serving size
      const servingInfoRows = Array.from(nutritionRows).filter(row => 
        row.textContent?.includes('Serving size')
      );
      
      if (servingInfoRows.length > 0) {
        const servingRow = servingInfoRows[0];
        const nextRow = servingRow.nextElementSibling;
        if (nextRow) {
          const servingSizeElement = nextRow.querySelector('li:nth-child(2)');
          if (servingSizeElement) {
            data.amount_per = servingSizeElement.textContent?.trim() || null;
            sourceMap['amount_per'] = servingSizeElement;
          }
        }
      }
      
      // Tìm hàng tiêu đề để xác định cột nào là "Per 100g"
      let per100gColumnIndex = 2; // Mặc định là cột thứ 3 (0-indexed)
      const headerRows = Array.from(nutritionRows).filter(row => 
        row.textContent?.includes('Quantity Per 100g')
      );
      
      if (headerRows.length > 0) {
        const headerCells = headerRows[0].querySelectorAll('li');
        for (let i = 0; i < headerCells.length; i++) {
          if (headerCells[i].textContent?.includes('100g')) {
            per100gColumnIndex = i;
            break;
          }
        }
      }
      
      // Mapping tên dinh dưỡng
      const nutritionMapping: Record<string, keyof NutritionData> = {
        'Energy': 'calories',
        'Protein': 'protein',
        'Fat, Total': 'fat',
        'Saturated': 'saturated_fat',
        'Carbohydrate': 'carbs',
        'Sugars': 'sugar',
        'Dietary Fibre': 'fiber',
        'Sodium': 'sodium',
        'Calcium': 'calcium',
        'Iron': 'iron'
      };
      
      // Xử lý từng hàng dinh dưỡng
      for (let i = 0; i < nutritionRows.length; i++) {
        const row = nutritionRows[i];
        const columns = row.querySelectorAll('li');
        
        if (columns.length <= per100gColumnIndex) continue;
        
        // Lấy tên dinh dưỡng từ cột đầu tiên
        const nameColumn = columns[0];
        if (!nameColumn) continue;
        
        const nutritionName = nameColumn.textContent?.trim() || '';
        
        // Nếu tên dinh dưỡng khớp với mapping, lấy giá trị
        for (const [key, dataKey] of Object.entries(nutritionMapping)) {
          if (nutritionName.includes(key)) {
            // Lấy giá trị từ cột Per 100g
            const valueColumn = columns[per100gColumnIndex];
            if (!valueColumn) continue;
            
            // Tìm phần tử span chứa giá trị
            const valueSpan = valueColumn.querySelector('span[aria-hidden="true"]');
            if (!valueSpan) continue;
            
            const valueText = valueSpan.textContent?.trim() || '';
            
            // Trích xuất số từ text
            const numericMatch = valueText.match(/(\d+(\.\d+)?)/);
            if (numericMatch) {
              data[dataKey] = parseFloat(numericMatch[1]);
              sourceMap[dataKey as string] = valueSpan;
            } else if (valueText !== '-') {
              // Nếu không phải dấu gạch ngang (not available)
              data[dataKey] = valueText as any;
              sourceMap[dataKey as string] = valueSpan;
            }
            
            break;
          }
        }
      }
      
      logger.info('Đã trích xuất xong dữ liệu Woolworths', data);
      return { data, sourceMap };
    } catch (error) {
      logger.error('Lỗi khi trích xuất dữ liệu Woolworths:', error);
      return { data: null, sourceMap: {} };
    }
  }
}
