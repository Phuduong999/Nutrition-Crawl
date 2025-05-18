/**
 * XPath Logging Utilities
 * Tools for logging the results of XPath queries to help with debugging and refining XPath mappings
 */

/**
 * Interface to represent a logged XPath result
 */
export interface XPathLogResult {
  url: string;
  xpathType: 'nutritionXPath' | 'altXPath';
  xpathExpression: string;
  matchCount: number;
  matches: Array<{
    index: number;
    textContent: string | null;
    htmlContent: string;
  }>;
}

/**
 * Evaluate an XPath expression and log detailed information about all matching nodes
 * 
 * @param xpath XPath expression to evaluate
 * @param xpathType Type of XPath being evaluated (nutritionXPath or altXPath)
 * @returns Object containing all log information and the first matching element
 */
export function evaluateAndLogXPath(
  xpath: string,
  xpathType: 'nutritionXPath' | 'altXPath' = 'nutritionXPath'
): { logResult: XPathLogResult; element: Element | null } {
  const url = window.location.href;
  const logResult: XPathLogResult = {
    url,
    xpathType,
    xpathExpression: xpath,
    matchCount: 0,
    matches: []
  };

  try {
    // Đầu tiên, lấy element đầu tiên để đảm bảo tương thích ngược
    const singleNodeResult = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE, 
      null
    );
    
    const firstElement = singleNodeResult.singleNodeValue as Element;
    
    // Sau đó, thử lấy tất cả các nodes để log
    try {
      const nodesResult = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      
      if (nodesResult) {
        logResult.matchCount = nodesResult.snapshotLength;
        
        // Chỉ log vài node đầu tiên để tránh xử lý quá nhiều
        const maxNodesToLog = Math.min(5, nodesResult.snapshotLength);
        for (let i = 0; i < maxNodesToLog; i++) {
          const node = nodesResult.snapshotItem(i) as Element;
          if (node) {
            logResult.matches.push({
              index: i,
              textContent: node.textContent ? 
                (node.textContent.length > 500 ? node.textContent.substring(0, 500) + '...' : node.textContent) 
                : null,
              htmlContent: node.outerHTML.length > 1000 ? 
                node.outerHTML.substring(0, 1000) + '...' : 
                node.outerHTML
            });
          }
        }
      }
    } catch (logError) {
      console.warn('Error while trying to log all nodes:', logError);
      // Nếu có lỗi khi log tất cả các nodes, vẫn giữ firstElement
      if (firstElement) {
        logResult.matchCount = 1;
        logResult.matches = [{
          index: 0,
          textContent: firstElement.textContent ? 
            (firstElement.textContent.length > 500 ? firstElement.textContent.substring(0, 500) + '...' : firstElement.textContent) 
            : null,
          htmlContent: firstElement.outerHTML.length > 1000 ? 
            firstElement.outerHTML.substring(0, 1000) + '...' : 
            firstElement.outerHTML
        }];
      }
    }

    // Log the results - chỉ thông báo ngắn gọn
    console.log(`XPath (${xpathType}) - Found: ${logResult.matchCount} matches`);
    
    return {
      logResult,
      element: firstElement
    };
  } catch (e) {
    console.error('XPath evaluation failed:', e);
    logResult.matchCount = 0;
    
    return {
      logResult,
      element: null
    };
  }
}

/**
 * Store XPath log results for later retrieval
 */
export class XPathLogStorage {
  private static logs: XPathLogResult[] = [];
  private static maxStorageSize = 100;

  /**
   * Add a log to storage
   */
  static addLog(log: XPathLogResult): void {
    // Prevent storage from growing too large
    if (this.logs.length >= this.maxStorageSize) {
      this.logs.shift(); // Remove oldest log
    }
    this.logs.push(log);
  }

  /**
   * Get all stored logs
   */
  static getLogs(): XPathLogResult[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON string
   */
  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
