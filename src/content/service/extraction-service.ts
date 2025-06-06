/**
 * Nutrition extraction service
 */

import type { NutritionExtractor, ExtractionResult, ExtractionSourceMap } from '../types';
import { getCurrentDomain, logger, highlightElement } from '../utils';
import { evaluateAndLogXPath, XPathLogStorage } from '../xpathLogger';
import { SchemaOrgExtractor } from '../extractors/schema-org-extractor';
import { HtmlExtractor } from '../extractors/html-extractor';
import { WoolworthsExtractor } from '../extractors/woolworths-extractor';
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
      new WoolworthsExtractor(), // Extractor riêng cho Woolworths
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
    // Xử lý dùng XPath mặc định
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
   * Phương thức chỉ bôi vàng phần tử mà không trích xuất dữ liệu
   * @returns Số lượng phần tử đã bôi vàng
   */
  public highlightElements(): number {
    const domain = getCurrentDomain();
    const siteConfig = trustedSources[domain];
    
    if (!siteConfig) {
      logger.error('This website is not supported for direct highlighting');
      return 0;
    }
    
    // Tìm phần tử chứa thông tin dinh dưỡng
    const nutritionElement = this.findNutritionElement(siteConfig);
    if (!nutritionElement) {
      logger.error('Could not find nutrition information on this page for highlighting');
      return 0;
    }
    
    // Bôi vàng phần tử chứa thông tin dinh dưỡng
    highlightElement(nutritionElement, 'Nutrition Data Container');
    
    // Thử trích xuất và bôi vàng các phần tử con
    let highlightCount = 1; // Tính cả container
    
    for (const extractor of this.extractors) {
      if (extractor.canExtract(nutritionElement)) {
        const extractionResult = extractor.extract(nutritionElement); // Thử trích xuất
        if (extractionResult.data && extractionResult.sourceMap) {
          this.highlightExtractedElements(extractionResult.sourceMap);
          highlightCount += Object.keys(extractionResult.sourceMap).filter(
            key => extractionResult.sourceMap[key] !== null
          ).length;
          break; // Dừng sau khi tìm thấy extractor đầu tiên phù hợp
        }
      }
    }
    
    return highlightCount;
  }
  
  /**
   * Trích xuất dữ liệu từ nguồn tin cậy cụ thể
   * @param sourceName Tên của nguồn tin cậy (domain)
   * @returns Kết quả trích xuất
   */
  public extractFromTrustedSource(sourceName: string): ExtractionResult {
    const siteConfig = trustedSources[sourceName];
    if (!siteConfig) {
      logger.error(`Source ${sourceName} not found in trusted sources`);
      return { data: null, sourceMap: {} };
    }
    
    // Sử dụng XPath từ nguồn tin cậy được chỉ định
    const xpath = siteConfig.nutritionXPath;
    if (!xpath) {
      logger.error(`No XPath defined for ${sourceName}`);
      return { data: null, sourceMap: {} };
    }
    
    // Tìm phần tử chứa thông tin dinh dưỡng
    let nutritionElement: Element | null = null;
    try {
      const result = evaluateAndLogXPath(xpath);
      nutritionElement = result.element;
      
      if (!nutritionElement && siteConfig.altXPath) {
        // Thử XPath thay thế nếu có
        const altResult = evaluateAndLogXPath(siteConfig.altXPath);
        nutritionElement = altResult.element;
      }
    } catch (error) {
      logger.error(`Error evaluating XPath for ${sourceName}`, error);
    }
    
    if (!nutritionElement) {
      logger.error(`Could not find nutrition element using XPath for ${sourceName}`);
      return { data: null, sourceMap: {} };
    }
    
    // Bôi vàng phần tử chứa thông tin dinh dưỡng
    highlightElement(nutritionElement, `Nutrition Data (${sourceName})`);
    
    // Thử trích xuất với từng extractor
    for (const extractor of this.extractors) {
      if (extractor.canExtract(nutritionElement)) {
        const extractionResult = extractor.extract(nutritionElement);
        if (extractionResult.data) {
          logger.info(`Successfully extracted nutrition data from ${sourceName} using extractor`, {
            extractor: extractor.constructor.name
          });
          
          // Bôi vàng các phần tử đã được trích xuất
          this.highlightExtractedElements(extractionResult.sourceMap);
          
          return extractionResult;
        }
      }
    }
    
    logger.error(`All extractors failed to extract nutrition data from ${sourceName}`);
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
    // Try primary XPath and log results
    const primaryResult = evaluateAndLogXPath(siteConfig.nutritionXPath, 'nutritionXPath');
    XPathLogStorage.addLog(primaryResult.logResult);
    let nutritionElement = primaryResult.element;

    // Try alternative XPath if available and primary failed
    if (!nutritionElement && siteConfig.altXPath) {
      const altResult = evaluateAndLogXPath(siteConfig.altXPath, 'altXPath');
      XPathLogStorage.addLog(altResult.logResult);
      nutritionElement = altResult.element;
    }

    // Log summary of XPath evaluation
    logger.info(`XPath Evaluation Summary:`, {
      url: window.location.href,
      domain: getCurrentDomain(),
      primaryXPathMatches: primaryResult.logResult.matchCount,
      altXPathMatches: siteConfig.altXPath ? 
        (nutritionElement && !primaryResult.element ? primaryResult.logResult.matchCount : 0) : 
        'No altXPath defined'
    });

    return nutritionElement;
  }
}
