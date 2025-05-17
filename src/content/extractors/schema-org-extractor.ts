/**
 * Schema.org nutrition data extractor
 */

import { defaultNutritionData } from '../../config/trustedSources';
import type { NutritionData } from '../../config/trustedSources';
import type { SchemaOrgNutrition, NutritionExtractor, ExtractionResult, ExtractionSourceMap } from '../types';
import { DOM_CONSTANTS, EXTRACTION_CONSTANTS, logger } from '../utils';

/**
 * Extractor implementation for Schema.org Nutrition Information format
 */
export class SchemaOrgExtractor implements NutritionExtractor {
  
  /**
   * Check if this element can be extracted using Schema.org format
   */
  canExtract(element: Element): boolean {
    const jsonScripts = element.querySelectorAll(DOM_CONSTANTS.LD_JSON_SELECTOR);
    return jsonScripts.length > 0;
  }
  
  /**
   * Extract nutrition data from Schema.org format
   */
  extract(element: Element): ExtractionResult {
    try {
      // Find all script tags with type="application/ld+json"
      const jsonScripts = element.querySelectorAll(DOM_CONSTANTS.LD_JSON_SELECTOR);
      
      for (const script of Array.from(jsonScripts)) {
        const content = script.textContent;
        if (!content) continue;

        let jsonData: any;
        try {
          jsonData = JSON.parse(content);
        } catch {
          continue;
        }

        // If it's an array, find in array
        if (Array.isArray(jsonData)) {
          jsonData = jsonData.find(item => item["@type"] === EXTRACTION_CONSTANTS.SCHEMA_TYPE.NUTRITION_INFORMATION);
        }
        // If not directly a NutritionInformation, search in nested objects
        else if (jsonData["@type"] !== EXTRACTION_CONSTANTS.SCHEMA_TYPE.NUTRITION_INFORMATION) {
          jsonData = this.findNutrition(jsonData);
        }

        if (jsonData && jsonData["@type"] === EXTRACTION_CONSTANTS.SCHEMA_TYPE.NUTRITION_INFORMATION) {
          const schema = jsonData as SchemaOrgNutrition;
          logger.info('Found schema.org nutrition data', schema);
          
          const data: NutritionData = {
            ...defaultNutritionData,
            calories: schema.calories || null,
            protein: schema.proteinContent || null,
            fat: schema.fatContent || null,
            carbs: schema.carbohydrateContent || null,
            fiber: schema.fiberContent || null,
            sugar: schema.sugarContent || null,
            added_sugar: null, // Not available in schema.org
            cholesterol: schema.cholesterolContent || null,
            sodium: schema.sodiumContent || null,
            saturated_fat: schema.saturatedFatContent || null,
            calcium: null, // Not available in schema.org
            iron: null, // Not available in schema.org
            amount_per: schema.servingSize || null
          };
          
          // Use the script element as the source for all schema.org properties
          const sourceMap: ExtractionSourceMap = {};
          for (const key in data) {
            if (data[key] !== null) {
              sourceMap[key] = script;
            }
          }
          
          return { data, sourceMap };
        }
      }
    } catch (e) {
      logger.error('Failed to parse schema.org nutrition data', e);
    }
    return { data: null, sourceMap: {} };
  }
  
  /**
   * Recursively find nutrition information in nested objects
   */
  private findNutrition(obj: any): any {
    if (obj["@type"] === EXTRACTION_CONSTANTS.SCHEMA_TYPE.NUTRITION_INFORMATION) return obj;
    if (typeof obj === "object") {
      for (const key in obj) {
        const result = this.findNutrition(obj[key]);
        if (result) return result;
      }
    }
    return null;
  }
}
