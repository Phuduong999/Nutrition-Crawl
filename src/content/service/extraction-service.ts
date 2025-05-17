/**
 * Nutrition extraction service
 */

import type { NutritionExtractor, ExtractionResult, ExtractionSourceMap } from '../types';
import { evaluateXPath, getCurrentDomain, logger, highlightElement } from '../utils';
import { SchemaOrgExtractor } from '../extractors/schema-org-extractor';
import { HtmlExtractor } from '../extractors/html-extractor';
import { trustedSources } from '../../config/trustedSources';

/**
 * Service for extracting nutrition data using different strategies
 */
export class NutritionExtractionService {
  private extractors: NutritionExtractor[];
  
  /**
   * Initialize the service with available extractors
   * @param extractors Optional custom extractors to use
   */
  constructor(extractors?: NutritionExtractor[]) {
    this.extractors = extractors || [
      new SchemaOrgExtractor(),
      new HtmlExtractor() // HTML extractor is the fallback strategy
    ];
  }
  
  /**
   * Main extraction method
   * @param highlight Whether to highlight extracted elements
   * @returns Extracted nutrition data or null if not found
   */
  public extractNutritionInfo(highlight: boolean = false): ExtractionResult {
    const domain = getCurrentDomain();
    const siteConfig = trustedSources[domain];

    if (!siteConfig) {
      logger.error('This website is not supported');
      return { data: null, sourceMap: {} };
    }

    // Find the nutrition element using XPath from configuration
    const nutritionElement = this.findNutritionElement(siteConfig);
    if (!nutritionElement) {
      logger.error('Could not find nutrition information on this page');
      return { data: null, sourceMap: {} };
    }

    // Highlight the main nutrition container if requested
    if (highlight) {
      highlightElement(nutritionElement, 'Nutrition Data Container');
    }

    // Try each extractor in sequence
    for (const extractor of this.extractors) {
      if (extractor.canExtract(nutritionElement)) {
        const extractionResult = extractor.extract(nutritionElement);
        if (extractionResult.data) {
          logger.info('Successfully extracted nutrition data using extractor', { 
            extractor: extractor.constructor.name 
          });
          
          // Apply highlighting to extracted elements if requested
          if (highlight) {
            this.highlightExtractedElements(extractionResult.sourceMap);
          }
          
          return extractionResult;
        }
      }
    }

    logger.error('All extractors failed to extract nutrition data');
    return { data: null, sourceMap: {} };
  }
  
  /**
   * Highlight elements that were used for successful nutrition data extraction
   * @param sourceMap Map of nutrition data keys to source elements
   */
  private highlightExtractedElements(sourceMap: ExtractionSourceMap): void {
    const nutritionLabels: Record<string, string> = {
      calories: 'Calories',
      protein: 'Protein',
      fat: 'Fat',
      carbs: 'Carbohydrates',
      fiber: 'Fiber',
      sugar: 'Sugar',
      added_sugar: 'Added Sugar',
      cholesterol: 'Cholesterol',
      sodium: 'Sodium',
      saturated_fat: 'Saturated Fat',
      calcium: 'Calcium',
      iron: 'Iron',
      amount_per: 'Serving Size'
    };
    
    // Highlight each extracted element with its label
    for (const [key, element] of Object.entries(sourceMap)) {
      if (element) {
        const label = nutritionLabels[key] || key;
        highlightElement(element, label);
      }
    }
  }
  
  /**
   * Find the nutrition element on the page using site configuration
   * @param siteConfig Configuration for the current site
   * @returns The nutrition element or null if not found
   */
  private findNutritionElement(siteConfig: any): Element | null {
    // Try primary XPath
    let nutritionElement = evaluateXPath(siteConfig.nutritionXPath);

    // Try alternative XPath if available and primary failed
    if (!nutritionElement && siteConfig.altXPath) {
      nutritionElement = evaluateXPath(siteConfig.altXPath);
    }

    return nutritionElement;
  }
}
