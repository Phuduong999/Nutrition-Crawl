/**
 * Type definitions for the nutrition extraction system
 */

import type { NutritionData } from '../config/trustedSources';

/**
 * Interface for Schema.org nutrition data format
 */
export interface SchemaOrgNutrition {
    "@type": "NutritionInformation";
    calories?: number;
    carbohydrateContent?: number;
    proteinContent?: number;
    fatContent?: number;
    fiberContent?: number;
    sugarContent?: number;
    cholesterolContent?: number;
    sodiumContent?: number;
    saturatedFatContent?: number;
    servingSize?: string;
}

/**
 * Interface for tracking extracted elements
 */
export interface ExtractionSourceMap {
    [key: string]: Element | null;
}

/**
 * Interface for extraction results with source tracking
 */
export interface ExtractionResult {
    data: NutritionData | null;
    sourceMap: ExtractionSourceMap;
}

/**
 * Interface for nutrition extractors
 */
export interface NutritionExtractor {
    canExtract(element: Element): boolean;
    extract(element: Element): ExtractionResult;
}

/**
 * Element selector strategies
 */
export interface ElementSelector {
    findElement(selectorData: string): Element | null;
}

/**
 * Extraction configuration
 */
export interface ExtractionConfig {
    selectors: {
        [key: string]: string[];
    };
    servingSizeLabels: string[];
}

/**
 * Logger interface for consistent logging
 */
export interface Logger {
    info(message: string, data?: any): void;
    error(message: string, error?: any): void;
    debug(message: string, data?: any): void;
}
