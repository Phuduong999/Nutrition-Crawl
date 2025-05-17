/**
 * Utility functions for nutrition extraction
 */

/**
 * CSS class for highlighting extracted elements
 */
export const HIGHLIGHT_CLASS = 'nutrition-crawler-highlight';

/**
 * Constants for DOM operations
 */
export const DOM_CONSTANTS = {
  XPATH_FIRST_NODE_TYPE: XPathResult.FIRST_ORDERED_NODE_TYPE,
  XPATH_ORDERED_NODE_SNAPSHOT: XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
  CASE_TRANSFORM_REGEX: {
    UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    LOWERCASE: 'abcdefghijklmnopqrstuvwxyz'
  },
  LD_JSON_SELECTOR: 'script[type="application/ld+json"]'
};

/**
 * Constants for nutrition extraction
 */
export const EXTRACTION_CONSTANTS = {
  SCHEMA_TYPE: {
    NUTRITION_INFORMATION: "NutritionInformation"
  },
  NUMBER_REGEX: /[^\d.]/g
};

/**
 * Extract number from text by finding the first numeric value
 * @param text The text to extract number from
 * @returns The extracted number or null if no valid number found
 */
export function extractNumberFromText(text: string): number | null {
  if (!text) return null;
  
  // Tìm số đầu tiên trong chuỗi (14g hoặc 14.5g)
  const match = text.match(/\b(\d+(\.\d+)?)\s*[a-zA-Z%]*/i);
  if (match && match[1]) {
    const value = parseFloat(match[1]);
    return isNaN(value) ? null : value;
  }
  
  // Nếu cách trên không hoạt động, thử phương pháp cũ nhưng chỉ lấy số đầu tiên
  const cleanText = text.replace(EXTRACTION_CONSTANTS.NUMBER_REGEX, ' ').trim().split(/\s+/)[0];
  const value = parseFloat(cleanText);
  return isNaN(value) ? null : value;
}

/**
 * Evaluates an XPath expression and returns the first matching element
 * @param xpath XPath expression to evaluate
 * @returns The first matching element or null if not found
 */
export function evaluateXPath(xpath: string): Element | null {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      DOM_CONSTANTS.XPATH_FIRST_NODE_TYPE,
      null
    );
    return result.singleNodeValue as Element;
  } catch (e) {
    console.error('XPath evaluation failed:', e);
    return null;
  }
}

/**
 * Get current domain without 'www' prefix
 * @returns Current domain
 */
export function getCurrentDomain(): string {
  return window.location.hostname.replace('www.', '');
}

/**
 * Create a case-insensitive XPath expression for text search
 * @param text Text to search for
 * @returns XPath expression for case-insensitive text search
 */
export function createCaseInsensitiveTextXPath(text: string): string {
  return `.//text()[contains(translate(., '${DOM_CONSTANTS.CASE_TRANSFORM_REGEX.UPPERCASE}', '${DOM_CONSTANTS.CASE_TRANSFORM_REGEX.LOWERCASE}'), '${text.toLowerCase()}')]`;
}

/**
 * Creates an XPath for class or id search
 * @param selector Class or id to search for
 * @returns XPath expression for class or id search
 */
export function createClassOrIdXPath(selector: string): string {
  return `.//*[contains(@class, '${selector}') or contains(@id, '${selector}')]`;
}

/**
 * Logger implementation
 */
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  debug: (message: string, data?: any) => {
    console.debug(`[DEBUG] ${message}`, data || '');
  }
};

/**
 * Apply a yellow highlight to an element
 * @param element The element to highlight
 * @param label Optional label for the highlighted element
 */
export function highlightElement(element: Element | null, label?: string): void {
  if (!element) return;
  
  // Create a style tag if it doesn't exist yet
  if (!document.getElementById('nutrition-crawler-styles')) {
    const style = document.createElement('style');
    style.id = 'nutrition-crawler-styles';
    style.textContent = `
      .${HIGHLIGHT_CLASS} {
        background-color: rgba(255, 255, 0, 0.5) !important;
        border: 1px solid #ff9900 !important;
        transition: background-color 0.3s ease !important;
        box-shadow: 0 0 5px #ff9900 !important;
      }
      .${HIGHLIGHT_CLASS}:hover {
        background-color: rgba(255, 255, 0, 0.7) !important;
      }
      .nutrition-crawler-label {
        position: absolute;
        background: #ff9900;
        color: white;
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 12px;
        z-index: 10000;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    
    // Log success message to console
    console.log('[Nutrition Crawler] Highlighting styles loaded successfully');
  }

  try {
    // Apply inline styles as a fallback mechanism
    // Cast to HTMLElement to access style property
    if (element instanceof HTMLElement) {
      element.style.setProperty('background-color', 'rgba(255, 255, 0, 0.5)', 'important');
      element.style.setProperty('border', '1px solid #ff9900', 'important'); 
      element.style.setProperty('box-shadow', '0 0 5px #ff9900', 'important');
    }
    
    // Also apply the class for completeness
    element.classList.add(HIGHLIGHT_CLASS);
    
    // Log success
    console.log(`[Nutrition Crawler] Successfully highlighted element: ${element.tagName}`, element);
    
    // Add a label if provided
    if (label) {
      const labelElem = document.createElement('span');
      labelElem.className = 'nutrition-crawler-label';
      labelElem.textContent = label;
      
      // Position the label
      const rect = element.getBoundingClientRect();
      labelElem.style.top = `${window.scrollY + rect.top - 20}px`;
      labelElem.style.left = `${window.scrollX + rect.left}px`;
      
      // Add some inline styles to ensure visibility
      labelElem.style.position = 'absolute';
      labelElem.style.backgroundColor = '#ff9900';
      labelElem.style.color = 'white';
      labelElem.style.padding = '2px 5px';
      labelElem.style.borderRadius = '3px';
      labelElem.style.fontSize = '12px';
      labelElem.style.zIndex = '10000';
      labelElem.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
      
      document.body.appendChild(labelElem);
      
      console.log(`[Nutrition Crawler] Added label: ${label}`);
      
      // Remove the label after some time
      setTimeout(() => {
        labelElem.remove();
      }, 7000);
    }
  } catch (error) {
    console.error('[Nutrition Crawler] Error applying highlight:', error);
  }
}
