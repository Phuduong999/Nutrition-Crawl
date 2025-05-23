export interface NutritionData {
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
    fiber: number | null;
    sugar: number | null;
    added_sugar: number | null;
    cholesterol: number | null;
    sodium: number | null;
    saturated_fat: number | null;
    calcium: number | null;
    iron: number | null;
    amount_per: string | null;
    // Index signature cho phép truy cập động
    [key: string]: number | string | null;
}

export interface SiteConfig {
    nutritionXPath: string;
    altXPath?: string;
}

export const defaultNutritionData: NutritionData = {
    calories: null,
    protein: null,
    fat: null,
    carbs: null,
    fiber: null,
    sugar: null,
    added_sugar: null,
    cholesterol: null,
    sodium: null,
    saturated_fat: null,
    calcium: null,
    iron: null,
    amount_per: null,
};

export const trustedSources: Record<string, SiteConfig> = {
    "eatthismuch.com": {
        nutritionXPath: '//*[contains(@class, "facts svelte")]'
    },
    "nutritionix.com": {
        nutritionXPath: '//*[@class="label-container"]',
        altXPath: '//div[@class="nf"]'
    },
    "woolworths.com.au": {
        nutritionXPath: '//div[contains(@class, "nutritional-info_component_nutritional-info-panel")]',
        altXPath: '//div[class*="nutritional-info-panel"]'
    }
};
