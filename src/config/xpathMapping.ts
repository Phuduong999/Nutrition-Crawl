import type { XPathMapping } from '../types';

// XPath cho thông tin dinh dưỡng Woolworths
export const accordionXPathMappings: XPathMapping[] = [
  {
    field: 'columnK',
    xpath: '//div[contains(@class, "nutritional-info_component_nutritional-info-panel")]//ul[contains(@class, "nutrition-row")][.//li[contains(text(), "Protein")]]//li[contains(@class, "value")]//span[@aria-hidden="true"][2]',
    columnIndex: 10,
    description: 'Protein'
  },
  {
    field: 'columnL',
    xpath: '//div[contains(@class, "nutritional-info_component_nutritional-info-panel")]//ul[contains(@class, "nutrition-row")][.//li[contains(text(), "Carbohydrate")]]//li[contains(@class, "value")]//span[@aria-hidden="true"][2]',
    columnIndex: 11,
    description: 'Carb'
  },
  {
    field: 'columnM',
    xpath: '//div[contains(@class, "nutritional-info_component_nutritional-info-panel")]//ul[contains(@class, "nutrition-row")][.//li[contains(text(), "Fat, Total")]]//li[contains(@class, "value")]//span[@aria-hidden="true"][2]',
    columnIndex: 12,
    description: 'Fat'
  },
  {
    field: 'columnN',
    xpath: '//div[contains(@class, "nutritional-info_component_nutritional-info-panel")]//ul[contains(@class, "nutrition-row")][.//li[contains(text(), "Energy")]]//li[contains(@class, "value")]//span[@aria-hidden="true"][2]',
    columnIndex: 13,
    description: 'Calo'
  },
  {
    field: 'columnO',
    xpath: '//div[contains(@class, "nutritional-info_component_nutritional-info-panel")]//ul[contains(@class, "nutrition-row")][.//li[contains(text(), "Dietary Fibre")]]//li[contains(@class, "value")]//span[@aria-hidden="true"][2]',
    columnIndex: 14,
    description: 'Fiber'
  },
  {
    field: 'columnP',
    xpath: '//div[contains(@class, "nutritional-info_component_nutritional-info-panel")]//ul[contains(@class, "nutrition-row")][.//li[contains(text(), "Sugars")]]//li[contains(@class, "value")]//span[@aria-hidden="true"][2]',
    columnIndex: 15,
    description: 'Sugar'
  },
  {
    field: 'columnQ',
    xpath: '//div[contains(@class, "nutritional-info_component_nutritional-info-panel")]//ul[contains(@class, "nutrition-row")][.//li[contains(text(), "Sodium")]]//li[contains(@class, "value")]//span[@aria-hidden="true"][2]',
    columnIndex: 16,
    description: 'Sodium'
  },
  {
    field: 'columnR',
    xpath: '//div[contains(@class, "nutritional-info_component_nutritional-info-panel")]//ul[contains(@class, "nutrition-row")][.//li[contains(text(), "Saturated")]]//li[contains(@class, "value")]//span[@aria-hidden="true"][2]',
    columnIndex: 17,
    description: 'Saturated Fat'
  },
  {
    field: 'columnS',
    xpath: '//div[contains(@class, "nutritional-info_component_nutritional-info-panel")]//ul[contains(@class, "nutrition-row")][.//li[contains(text(), "Calcium")]]//li[contains(@class, "value")]//span[@aria-hidden="true"][2]',
    columnIndex: 18,
    description: 'Canxi'
  },
  {
    field: 'columnT',
    xpath: '//div[contains(@class, "nutritional-info_component_nutritional-info-panel")]//ul[contains(@class, "nutrition-row")][.//li[contains(text(), "Iron")]]//li[contains(@class, "value")]//span[@aria-hidden="true"][2]',
    columnIndex: 19,
    description: 'Iron'
  }
];

// XPath cụ thể cho trang Nutritionix.com
export const nutritionixXPathMappings: XPathMapping[] = [
  {
    field: 'columnK',
    xpath: '//span[@itemprop="proteinContent"]',
    columnIndex: 10,
    description: 'Protein'
  },
  {
    field: 'columnL',
    xpath: '//span[@itemprop="carbohydrateContent"]',
    columnIndex: 11,
    description: 'Carb'
  },
  {
    field: 'columnM',
    xpath: '//span[@itemprop="fatContent"]',
    columnIndex: 12,
    description: 'Fat'
  },
  {
    field: 'columnN',
    xpath: '//span[@itemprop="calories"]',
    columnIndex: 13,
    description: 'Calo'
  },
  {
    field: 'columnO',
    xpath: '//span[@itemprop="fiberContent"]',
    columnIndex: 14,
    description: 'Fiber'
  },
  {
    field: 'columnP',
    xpath: '//span[@itemprop="sugarContent"]',
    columnIndex: 15,
    description: 'Sugar'
  },
  {
    field: 'columnQ',
    xpath: '//span[@itemprop="cholesterolContent"]',
    columnIndex: 16,
    description: 'Cholesterol'
  },
  {
    field: 'columnR',
    xpath: '//span[@itemprop="saturatedFatContent"]',
    columnIndex: 17,
    description: 'Saturated Fat'
  },
  {
    field: 'columnS',
    xpath: '//span[@itemprop="calciumContent"] | //div[contains(text(),"Calcium")]/following-sibling::div[1]',
    columnIndex: 18,
    description: 'Canxi'
  },
  {
    field: 'columnT',
    xpath: '//span[@itemprop="ironContent"] | //div[contains(text(),"Iron")]/following-sibling::div[1]',
    columnIndex: 19,
    description: 'Iron'
  }
];

// XPath cụ thể cho trang EatThisMuch.com
export const eatThisMuchXPathMappings: XPathMapping[] = [
  {
    field: 'columnK',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Protein")]]/td[1]',
    columnIndex: 10,
    description: 'Protein'
  },
  {
    field: 'columnL',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Carbs")]]/td[1]',
    columnIndex: 11,
    description: 'Carb'
  },
  {
    field: 'columnM',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Fats")]]/td[1]',
    columnIndex: 12,
    description: 'Fat'
  },
  {
    field: 'columnN',
    xpath: '//*[contains(@class, "facts svelte")]//tr[contains(@class, "calories")]/td[1]',
    columnIndex: 13,
    description: 'Calo'
  },
  {
    field: 'columnO',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Fiber")]]/td[1]',
    columnIndex: 14,
    description: 'Fiber'
  },
  {
    field: 'columnP',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Sugar")]]/td[1]',
    columnIndex: 15,
    description: 'Sugar'
  },
  {
    field: 'columnQ',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Cholesterol")]]/td[1]',
    columnIndex: 16,
    description: 'Cholesterol'
  },
  {
    field: 'columnR',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Saturated fats")]]/td[1]',
    columnIndex: 17,
    description: 'Saturated Fat'
  },
  {
    field: 'columnS',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Calcium")]]/td[1]',
    columnIndex: 18,
    description: 'Canxi'
  },
  {
    field: 'columnT',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Iron")]]/td[1]',
    columnIndex: 19,
    description: 'Iron'
  }
];

// Định nghĩa mapping giữa các trường dữ liệu dinh dưỡng và cột Excel (K-T)
export const defaultXPathMappings: XPathMapping[] = [
  {
    field: 'columnK',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Protein")]/following-sibling::div[1]',
    columnIndex: 10, // Cột K (0-indexed là 10)
    description: 'Protein'
  },
  {
    field: 'columnL',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Carbohydrates")]/following-sibling::div[1]',
    columnIndex: 11, // Cột L
    description: 'Carb'
  },
  {
    field: 'columnM',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Fat")]/following-sibling::div[1]',
    columnIndex: 12, // Cột M
    description: 'Fat'
  },
  {
    field: 'columnN',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Calories")]/following-sibling::div[1]',
    columnIndex: 13, // Cột N
    description: 'Calo'
  },
  {
    field: 'columnO',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Fiber")]/following-sibling::div[1]',
    columnIndex: 14, // Cột O
    description: 'Fiber'
  },
  {
    field: 'columnP',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Sugar")]/following-sibling::div[1]',
    columnIndex: 15, // Cột P
    description: 'Sugar'
  },
  {
    field: 'columnQ',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Cholesterol")]/following-sibling::div[1]',
    columnIndex: 16, // Cột Q
    description: 'Cholesterol'
  },
  {
    field: 'columnR',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Saturated Fat")]/following-sibling::div[1]',
    columnIndex: 17, // Cột R
    description: 'Saturated Fat'
  },
  {
    field: 'columnS',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Calcium")]/following-sibling::div[1]',
    columnIndex: 18, // Cột S
    description: 'Canxi'
  },
  {
    field: 'columnT',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Iron")]/following-sibling::div[1]',
    columnIndex: 19, // Cột T
    description: 'Iron'
  }
];

// Helper function để lấy field name từ column index
export const getFieldFromColumnIndex = (columnIndex: number): string => {
  const mapping = defaultXPathMappings.find(item => item.columnIndex === columnIndex);
  return mapping?.field || '';
};

// Helper function để lấy description từ field name
export const getDescriptionFromField = (field: string): string => {
  const mapping = defaultXPathMappings.find(item => item.field === field);
  return mapping?.description || field;
};
