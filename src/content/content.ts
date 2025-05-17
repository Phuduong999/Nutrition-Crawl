/**
 * Content script for nutrition data extraction
 * 
 * This module is the main entry point for the Chrome extension content script.
 * It handles message communication with the popup and delegates the actual
 * nutrition data extraction to specialized services.
 */

import type { ExtractionResult } from './types';
import { NutritionExtractionService } from './service/extraction-service';
import { logger } from './utils';

/**
 * Initialize the nutrition extraction service
 */
const extractionService = new NutritionExtractionService();

/**
 * Main entry point for nutrition extraction
 * @param highlight Whether to highlight extracted elements
 * @returns Extraction result containing data and source map
 */
function extractNutritionInfo(highlight: boolean = false): ExtractionResult {
  try {
    return extractionService.extractNutritionInfo(highlight);
  } catch (error) {
    logger.error('Unexpected error during nutrition extraction', error);
    return { data: null, sourceMap: {} };
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'extractNutrition') {
    // Extract with highlighting enabled
    const result = extractNutritionInfo(true);
    
    // Capture screenshots of highlighted elements if data exists
    if (result.data) {
      // Define interface for source info to fix TypeScript errors
      interface SourceElementInfo {
        tagName: string;
        textContent: string;
        position: {
          top: number;
          left: number;
          width: number;
          height: number;
        };
      }
      
      // Create a map of element screenshots for the popup
      const previewData = {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
        data: result.data,
        // We won't store the actual DOM elements but rather info about them
        sourceInfo: {} as Record<string, SourceElementInfo>
      };
      
      // Get info about each highlighted element
      for (const [key, element] of Object.entries(result.sourceMap)) {
        if (element) {
          // Store position info for each element
          const rect = element.getBoundingClientRect();
          previewData.sourceInfo[key] = {
            tagName: element.tagName,
            textContent: element.textContent?.trim().substring(0, 100) || '',
            position: {
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width,
              height: rect.height
            }
          };
        }
      }
      
      // Save to Chrome storage
      chrome.storage.local.set({ 'nutritionPreview': previewData }, () => {
        logger.info('Saved nutrition preview data to Chrome storage');
      });
    }
    
    sendResponse({ success: !!result.data, data: result.data });
  }
  return true; // Required for async response
});
