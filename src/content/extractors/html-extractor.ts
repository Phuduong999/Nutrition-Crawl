/**
 * HTML-based nutrition data extractor
 */

import { defaultNutritionData } from '../../config/trustedSources';
import type { NutritionData } from '../../config/trustedSources';
import type { NutritionExtractor, ExtractionConfig, ExtractionResult, ExtractionSourceMap } from '../types';
import { 
  extractNumberFromText, 
  createCaseInsensitiveTextXPath, 
  createClassOrIdXPath, 
  logger, 
  DOM_CONSTANTS 
} from '../utils';

/**
 * Default extraction configuration
 */
export const DEFAULT_EXTRACTION_CONFIG: ExtractionConfig = {
  selectors: {
    protein: ['protein'],
    fat: ['total fat', 'fat'],
    carbs: ['total carbohydrate', 'carbs'],
    fiber: ['dietary fiber'],
    sugar: ['total sugars', 'sugar'],
    added_sugar: ['added sugar'],
    cholesterol: ['cholesterol'],
    sodium: ['sodium'],
    saturated_fat: ['saturated fat'],
    calcium: ['calcium'],
    iron: ['iron'],
    calories: ['calories', 'kcal']
  },
  servingSizeLabels: ['serving size', 'amount per serving', 'servings per container']
};

/**
 * Extractor implementation for HTML-based nutrition labels
 */
export class HtmlExtractor implements NutritionExtractor {
  private config: ExtractionConfig;
  
  constructor(config: ExtractionConfig = DEFAULT_EXTRACTION_CONFIG) {
    this.config = config;
  }
  
  /**
   * Always return true as this is the fallback extractor
   */
  canExtract(_element: Element): boolean {
    return true;
  }
  
  /**
   * Extract nutrition data from HTML content
   */
  extract(element: Element): ExtractionResult {
    const data = { ...defaultNutritionData };
    const sourceMap: ExtractionSourceMap = {};
    
    // Extract each nutrition value
    for (const [key, selectors] of Object.entries(this.config.selectors)) {
      for (const selector of selectors) {
        const result = this.findValue(element, selector);
        if (result.value !== null) {
          // Ensure we're setting the right type (number | null)
          data[key as keyof NutritionData] = result.value as any;
          sourceMap[key] = result.sourceElement;
          break;
        }
      }
    }
    
    // Try to find serving size
    for (const label of this.config.servingSizeLabels) {
      const result = this.findServingSize(element, label);
      if (result.value) {
        data.amount_per = result.value;
        sourceMap['amount_per'] = result.sourceElement;
        break;
      }
    }
    
    logger.info('Extracted HTML-based nutrition data', data);
    return { data, sourceMap };
  }
  
  /**
   * Find a numeric value for a given nutrition label
   * @returns Object containing the value and source element
   */
  private findValue(element: Element, selector: string): { value: number | null; sourceElement: Element | null } {
    try {
      // Look for text containing the selector
      const xpath = createCaseInsensitiveTextXPath(selector);
      const result = document.evaluate(xpath, element, null, DOM_CONSTANTS.XPATH_ORDERED_NODE_SNAPSHOT, null);
      
      // Check each matching text node
      for (let i = 0; i < result.snapshotLength; i++) {
        const textNode = result.snapshotItem(i);
        if (!textNode) continue;

        // Check parent elements for numeric values
        let parent = (textNode as Node).parentElement;
        while (parent) {
          const text = parent.textContent || '';
          const value = extractNumberFromText(text);
          if (value !== null) {
            logger.debug(`Found value ${value} for ${selector} in text: "${text}"`);
            return { value, sourceElement: parent };
          }
          parent = parent.parentElement;
        }
      }

      // Try class or ID-based lookup
      const classIdXPath = createClassOrIdXPath(selector);
      const elemResult = document.evaluate(
        classIdXPath, 
        element, 
        null, 
        DOM_CONSTANTS.XPATH_ORDERED_NODE_SNAPSHOT, 
        null
      );
      
      for (let i = 0; i < elemResult.snapshotLength; i++) {
        const elem = elemResult.snapshotItem(i) as Element;
        if (!elem) continue;
        
        const value = extractNumberFromText(elem.textContent || '');
        if (value !== null) {
          logger.debug(`Found value ${value} for ${selector} in element with class/id`);
          return { value, sourceElement: elem };
        }
      }
    } catch (e) {
      logger.error(`Error finding value for ${selector}`, e);
    }
    
    return { value: null, sourceElement: null };
  }
  
  /**
   * Find serving size information
   * @returns Object containing the value and source element
   */
  private findServingSize(element: Element, label: string): { value: string | null; sourceElement: Element | null } {
    const xpath = createCaseInsensitiveTextXPath(label);
    try {
      const result = document.evaluate(
        xpath, 
        element, 
        null, 
        DOM_CONSTANTS.XPATH_ORDERED_NODE_SNAPSHOT, 
        null
      );
      
      for (let i = 0; i < result.snapshotLength; i++) {
        const textNode = result.snapshotItem(i);
        if (!textNode?.textContent) continue;
        const text = textNode.textContent.trim();
        if (text) {
          const sourceElement = (textNode as Node).parentElement;
          return { value: text, sourceElement };
        }
      }
    } catch (e) {
      logger.error(`Error finding serving size for ${label}`, e);
    }
    
    return { value: null, sourceElement: null };
  }
}
