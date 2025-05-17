import type { NutritionData } from '../config/trustedSources';
import { trustedSources, defaultNutritionData } from '../config/trustedSources';

interface SchemaOrgNutrition {
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

function extractNumberFromText(text: string): number | null {
    // Chỉ lấy số từ text, bỏ qua các đơn vị và ký tự khác
    text = text.replace(/[^\d.]/g, '').trim();
    const value = parseFloat(text);
    return isNaN(value) ? null : value;
}

function evaluateXPath(xpath: string): Element | null {
    try {
        const result = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        );
        return result.singleNodeValue as Element;
    } catch (e) {
        console.error('XPath evaluation failed:', e);
        return null;
    }
}

function tryParseSchemaOrgNutrition(element: Element): NutritionData | null {
    try {
        // Tìm tất cả script tags có type="application/ld+json"
        const jsonScripts = element.querySelectorAll('script[type="application/ld+json"]');
        
        for (const script of Array.from(jsonScripts)) {
            const content = script.textContent;
            if (!content) continue;

            let jsonData: any;
            try {
                jsonData = JSON.parse(content);
            } catch {
                continue;
            }

            // Nếu là mảng, tìm trong mảng
            if (Array.isArray(jsonData)) {
                jsonData = jsonData.find(item => item["@type"] === "NutritionInformation");
            }
            // Nếu không phải NutritionInformation trực tiếp, tìm trong nested objects
            else if (jsonData["@type"] !== "NutritionInformation") {
                const findNutrition = (obj: any): any => {
                    if (obj["@type"] === "NutritionInformation") return obj;
                    if (typeof obj === "object") {
                        for (const key in obj) {
                            const result = findNutrition(obj[key]);
                            if (result) return result;
                        }
                    }
                    return null;
                };
                jsonData = findNutrition(jsonData);
            }

            if (jsonData && jsonData["@type"] === "NutritionInformation") {
                const schema = jsonData as SchemaOrgNutrition;
                return {
                    ...defaultNutritionData,
                    calories: schema.calories || null,
                    protein: schema.proteinContent || null,
                    fat: schema.fatContent || null,
                    carbs: schema.carbohydrateContent || null,
                    fiber: schema.fiberContent || null,
                    sugar: schema.sugarContent || null,
                    added_sugar: null, // Không có trong schema.org
                    cholesterol: schema.cholesterolContent || null,
                    sodium: schema.sodiumContent || null,
                    saturated_fat: schema.saturatedFatContent || null,
                    calcium: null, // Không có trong schema.org
                    iron: null, // Không có trong schema.org
                    amount_per: schema.servingSize || null
                };
            }
        }
    } catch (e) {
        console.error('Failed to parse schema.org nutrition data:', e);
    }
    return null;
}

function extractNutritionData(element: Element): NutritionData {
    // Thử lấy dữ liệu từ schema.org trước
    const schemaData = tryParseSchemaOrgNutrition(element);
    if (schemaData) {
        console.log('Found schema.org nutrition data:', schemaData);
        return schemaData;
    }

    const data = { ...defaultNutritionData };

    // Helper function to find and extract numeric values
    const findValue = (selector: string): number | null => {
        try {
            // Tìm tất cả phần tử có chứa text
            const xpath = `.//text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${selector.toLowerCase()}')]`;
            const result = document.evaluate(xpath, element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            
            for (let i = 0; i < result.snapshotLength; i++) {
                const textNode = result.snapshotItem(i);
                if (!textNode) continue;

                // Tìm phần tử cha chứa số
                let parent = (textNode as Node).parentElement;
                while (parent) {
                    const text = parent.textContent || '';
                    const value = extractNumberFromText(text);
                    if (value !== null) {
                        console.log(`Found value ${value} for ${selector} in text: "${text}"`);
                        return value;
                    }
                    parent = parent.parentElement;
                }
            }

            // Thử tìm theo class hoặc id
            const classIdXPath = `.//*[contains(@class, '${selector}') or contains(@id, '${selector}')]`;
            const elemResult = document.evaluate(classIdXPath, element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            
            for (let i = 0; i < elemResult.snapshotLength; i++) {
                const elem = elemResult.snapshotItem(i) as Element;
                if (!elem) continue;
                
                const value = extractNumberFromText(elem.textContent || '');
                if (value !== null) {
                    console.log(`Found value ${value} for ${selector} in element with class/id`);
                    return value;
                }
            }
        } catch (e) {
            console.error(`Error finding value for ${selector}:`, e);
        }
        
        return null;
    };

    // Extract data based on exact nutrition label patterns
    // data.calories = findValue('calories') || findValue('kcal');
    data.protein = findValue('protein');
    data.fat = findValue('total fat') || findValue('fat');
    data.carbs = findValue('total carbohydrate') || findValue('carbs');
    data.fiber = findValue('dietary fiber');
    data.sugar = findValue('total sugars') || findValue('sugar');
    data.added_sugar = findValue('added sugar');
    data.cholesterol = findValue('cholesterol');
    data.sodium = findValue('sodium');
    data.saturated_fat = findValue('saturated fat');
    data.calcium = findValue('calcium');
    data.iron = findValue('iron');

    // Try to find serving size using XPath
    const servingLabels = ['serving size', 'amount per serving', 'servings per container'];
    for (const label of servingLabels) {
        const xpath = `.//text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${label.toLowerCase()}')]`;
        try {
            const result = document.evaluate(xpath, element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            for (let i = 0; i < result.snapshotLength; i++) {
                const textNode = result.snapshotItem(i);
                if (!textNode?.textContent) continue;
                const text = textNode.textContent.trim();
                if (text) {
                    data.amount_per = text;
                    break;
                }
            }
        } catch (e) {
            console.error(`Error finding serving size for ${label}:`, e);
        }
        if (data.amount_per) break;
    }

    console.log('Extracted nutrition data:', data);
    return data;
}

function getCurrentDomain(): string {
    return window.location.hostname.replace('www.', '');
}

// Main extraction function
function extractNutritionInfo(): NutritionData | null {
    const domain = getCurrentDomain();
    const siteConfig = trustedSources[domain];

    if (!siteConfig) {
        console.error('This website is not supported');
        return null;
    }

    // Try primary XPath
    let nutritionElement = evaluateXPath(siteConfig.nutritionXPath);

    // Try alternative XPath if available and primary failed
    if (!nutritionElement && siteConfig.altXPath) {
        nutritionElement = evaluateXPath(siteConfig.altXPath);
    }

    if (!nutritionElement) {
        console.error('Could not find nutrition information on this page');
        return null;
    }

    return extractNutritionData(nutritionElement);
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'extractNutrition') {
        const data = extractNutritionInfo();
        sendResponse({ success: true, data });
    }
    return true; // Required for async response
});
