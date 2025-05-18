import type { XPathMapping } from '../types';

// XPath cụ thể cho trang Nutritionix.com
export const nutritionixXPathMappings: XPathMapping[] = [
  {
    field: 'columnK',
    xpath: '//span[@itemprop="calories"]',
    columnIndex: 10,
    description: 'Calories'
  },
  {
    field: 'columnL',
    xpath: '//span[@itemprop="proteinContent"]',
    columnIndex: 11,
    description: 'Protein'
  },
  {
    field: 'columnM',
    xpath: '//span[@itemprop="fatContent"]',
    columnIndex: 12,
    description: 'Fat'
  },
  {
    field: 'columnN',
    xpath: '//span[@itemprop="carbohydrateContent"]',
    columnIndex: 13,
    description: 'Carbs'
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
    xpath: '//span[@itemprop="addedSugarContent"] | //div[contains(text(),"Added Sugars")]/following-sibling::div[1]',
    columnIndex: 16,
    description: 'Added Sugar'
  },
  {
    field: 'columnR',
    xpath: '//span[@itemprop="cholesterolContent"]',
    columnIndex: 17,
    description: 'Cholesterol'
  },
  {
    field: 'columnS',
    xpath: '//span[@itemprop="sodiumContent"]',
    columnIndex: 18,
    description: 'Sodium'
  },
  {
    field: 'columnT',
    xpath: '//span[@itemprop="saturatedFatContent"]',
    columnIndex: 19,
    description: 'Saturated Fat'
  }
];

// XPath cụ thể cho trang EatThisMuch.com
export const eatThisMuchXPathMappings: XPathMapping[] = [
  {
    field: 'columnK',
    xpath: '//*[contains(@class, "facts svelte")]//tr[contains(@class, "calories")]/td[1]',
    columnIndex: 10,
    description: 'Calories'
  },
  {
    field: 'columnL',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Protein")]]/td[1]',
    columnIndex: 11,
    description: 'Protein'
  },
  {
    field: 'columnM',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Fats")]]/td[1]',
    columnIndex: 12,
    description: 'Fat'
  },
  {
    field: 'columnN',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Carbs")]]/td[1]',
    columnIndex: 13,
    description: 'Carbs'
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
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Added Sugar")]]/td[1]',
    columnIndex: 16,
    description: 'Added Sugar'
  },
  {
    field: 'columnR',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Cholesterol")]]/td[1]',
    columnIndex: 17,
    description: 'Cholesterol'
  },
  {
    field: 'columnS',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Sodium")]]/td[1]',
    columnIndex: 18,
    description: 'Sodium'
  },
  {
    field: 'columnT',
    xpath: '//*[contains(@class, "facts svelte")]//tr[th[contains(text(), "Saturated fats")]]/td[1]',
    columnIndex: 19,
    description: 'Saturated Fat'
  }
];

// Định nghĩa mapping giữa các trường dữ liệu dinh dưỡng và cột Excel (K-T)
export const defaultXPathMappings: XPathMapping[] = [
  {
    field: 'columnK',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Calories")]/following-sibling::div[1]',
    columnIndex: 10, // Cột K (0-indexed là 10)
    description: 'Calories'
  },
  {
    field: 'columnL',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Protein")]/following-sibling::div[1]',
    columnIndex: 11, // Cột L
    description: 'Protein'
  },
  {
    field: 'columnM',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Fat")]/following-sibling::div[1]',
    columnIndex: 12, // Cột M
    description: 'Fat'
  },
  {
    field: 'columnN',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Carbs")]/following-sibling::div[1]',
    columnIndex: 13, // Cột N
    description: 'Carbs'
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
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Added Sugar")]/following-sibling::div[1]',
    columnIndex: 16, // Cột Q
    description: 'Added Sugar'
  },
  {
    field: 'columnR',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Cholesterol")]/following-sibling::div[1]',
    columnIndex: 17, // Cột R
    description: 'Cholesterol'
  },
  {
    field: 'columnS',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Sodium")]/following-sibling::div[1]',
    columnIndex: 18, // Cột S
    description: 'Sodium'
  },
  {
    field: 'columnT',
    xpath: '//div[contains(@class, "nutrition-facts")]//div[contains(text(), "Saturated Fat")]/following-sibling::div[1]',
    columnIndex: 19, // Cột T
    description: 'Saturated Fat'
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
