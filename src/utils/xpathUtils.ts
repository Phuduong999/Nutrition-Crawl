import { defaultXPathMappings, nutritionixXPathMappings, eatThisMuchXPathMappings, accordionXPathMappings } from '../config/xpathMapping';
import { logger } from '../store/logStore';
import { getTrustedDomain } from './urlUtils';
import type { XPathMapping } from '../types';

/**
 * Lấy cấu hình XPath phù hợp cho một URL cụ thể
 * @param url URL cần xử lý
 * @returns Cấu hình XPath phù hợp
 */
export const getXPathConfigForUrl = (url: string): XPathMapping[] => {
  try {
    const domain = getTrustedDomain(url);
    
    if (domain) {
      logger.url(`Sử dụng XPath cụ thể cho domain: ${domain}`, { url, domain });
      
      if (domain === 'nutritionix.com') {
        // Sử dụng cấu hình XPath riêng cho nutritionix.com
        const config = [...nutritionixXPathMappings];
        logger.url(`Áp dụng ${config.length} XPath cho Nutritionix`, {
          sample: config.slice(0, 3).map(x => ({ field: x.field, xpath: x.xpath }))
        });
        return config;
      } else if (domain === 'eatthismuch.com') {
        // Sử dụng cấu hình XPath riêng cho eatthismuch.com
        const config = [...eatThisMuchXPathMappings];
        logger.url(`Áp dụng ${config.length} XPath cho EatThisMuch`, {
          sample: config.slice(0, 3).map(x => ({ field: x.field, xpath: x.xpath }))
        });
        return config;
      } else if (domain === 'woolworths.com.au') {
        // Sử dụng cấu hình XPath riêng cho woolworths.com.au
        const config = [...accordionXPathMappings];
        logger.url(`Áp dụng ${config.length} XPath cho Woolworths`, {
          sample: config.slice(0, 3).map(x => ({ field: x.field, xpath: x.xpath }))
        });
        return config;
      }
    }
    
    // Mặc định cho domain khác
    logger.url(`Sử dụng XPath mặc định cho URL: ${url}`);
    return [...defaultXPathMappings];
  } catch (e) {
    logger.error('Lỗi khi xác định XPath cho site:', e);
    // Sử dụng cấu hình mặc định
    return [...defaultXPathMappings];
  }
};

/**
 * Tạo script để chạy trong browser và trích xuất dữ liệu theo XPath
 * @param mappings Cấu hình XPath cần sử dụng
 * @returns Đoạn script thực thi trong browser
 */
export const createXPathExtractionScript = () => {
  return (mappings: XPathMapping[]) => {
    console.log('Starting XPath extraction with mappings:', mappings);
    const results: Record<string, string | null> = {};
    
    for (const mapping of mappings) {
      try {
        const xpath = mapping.xpath;
        const field = mapping.field;
        
        console.log(`Processing XPath: ${xpath} for field: ${field}`);
        
        // Thử nhiều cách để tìm dữ liệu
        
        // Cách 1: Thử dùng XPath trực tiếp
        try {
          const elements = document.evaluate(
            xpath, 
            document, 
            null, 
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
            null
          );
          
          if (elements.snapshotLength > 0) {
            const element = elements.snapshotItem(0) as HTMLElement;
            let rawValue = element.textContent?.trim() || null;
            
            // Xử lý làm sạch giá trị được trích xuất để chỉ lấy số
            if (rawValue) {
              // Tách số từ giá trị (ví dụ "14g" -> "14")
              const numericMatch = rawValue.match(/(\d+(\.\d+)?)/);
              if (numericMatch) {
                // Chỉ lấy giá trị số
                rawValue = numericMatch[1];
              } else {
                // Nếu không tìm thấy số, giữ nguyên giá trị
                console.log(`No numeric value found in: ${rawValue}`);
              }
            }
            
            results[field] = rawValue;
            
            // Log chi tiết kết quả XPath extraction
            try {
              // Dùng chrome.runtime.sendMessage để gửi dữ liệu extraction về background
              chrome.runtime.sendMessage({
                action: 'log_xpath_extraction',
                data: {
                  type: 'xpath',
                  url: window.location.href,
                  field: field,
                  description: mapping.description,
                  xpath: mapping.xpath,
                  value: results[field],
                  rawTextContent: element.textContent,
                  cleanedValue: results[field],
                  element: {
                    tagName: element.tagName,
                    textContent: element.textContent,
                    innerHTML: element.innerHTML.length > 200 ? 
                      element.innerHTML.substring(0, 200) + '...' : 
                      element.innerHTML,
                    attributes: Array.from(element.attributes).map(attr => ({ 
                      name: attr.name, 
                      value: attr.value 
                    })),
                  }
                }
              });
            } catch (logError) {
              console.error('Failed to log XPath extraction:', logError);
            }
            
            console.log(`Found value for ${field}:`, results[field]);
          }
        } catch (e) {
          console.log(`XPath execution failed for ${field}:`, e);
        }
        
        // Có thể thêm các cách khác để tìm thông tin nếu cần thiết
      } catch (error) {
        console.error(`Error processing field ${mapping.field}:`, error);
      }
    }
    
    return results;
  };
};
