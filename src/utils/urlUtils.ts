import { trustedSources } from '../config/trustedSources';
import { logger } from '../store/logStore';

/**
 * Kiểm tra URL có thuộc nguồn tin cậy không
 * @param url URL cần kiểm tra
 * @returns true nếu URL thuộc nguồn tin cậy
 */
export const isTrustedSource = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname;
    const isTrusted = Object.keys(trustedSources).some(domain => hostname.includes(domain));
    
    // Log kết quả kiểm tra source
    logger.url(`Kiểm tra nguồn tin cậy: ${url}`, {
      hostname,
      isTrusted,
      availableTrustedDomains: Object.keys(trustedSources)
    });
    
    return isTrusted;
  } catch (error) {
    logger.error(`Lỗi khi kiểm tra URL: ${url}`, error);
    return false;
  }
};

/**
 * Lấy tên miền từ URL
 * @param url URL cần xử lý
 * @returns tên miền của URL
 */
export const getDomainFromUrl = (url: string): string | null => {
  try {
    const hostname = new URL(url).hostname;
    return hostname;
  } catch (error) {
    logger.error(`Lỗi khi lấy domain từ URL: ${url}`, error);
    return null;
  }
};

/**
 * Lấy domain tin cậy tương ứng (nếu có)
 * @param url URL cần xử lý
 * @returns domain tin cậy nếu URL thuộc nguồn tin cậy
 */
export const getTrustedDomain = (url: string): string | null => {
  try {
    const hostname = new URL(url).hostname;
    const domain = Object.keys(trustedSources).find(d => hostname.includes(d));
    return domain || null;
  } catch (error) {
    logger.error(`Lỗi khi lấy trusted domain từ URL: ${url}`, error);
    return null;
  }
};

/**
 * Xác thực tính hợp lệ của URL
 * @param url URL cần kiểm tra
 * @returns true nếu URL hợp lệ
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};
