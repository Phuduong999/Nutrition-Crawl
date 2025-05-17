import React from 'react';
import { 
  IconFlame, IconEgg, IconCheese, IconBread, IconLeaf, IconApple, IconHeartFilled, 
  IconSalad, IconScale, IconChartBar 
} from '@tabler/icons-react';

// Hàm trả về icon cho mỗi loại dinh dưỡng
export const getNutritionIcon = (key: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    calories: <IconFlame size={18} />,
    protein: <IconEgg size={18} />,
    fat: <IconCheese size={18} />,
    carbs: <IconBread size={18} />,
    fiber: <IconLeaf size={18} />,
    sugar: <IconApple size={18} />,
    added_sugar: <IconApple size={18} />,
    cholesterol: <IconHeartFilled size={18} />,
    sodium: <IconSalad size={18} />,
    saturated_fat: <IconCheese size={18} />,
    calcium: <IconScale size={18} />,
    iron: <IconChartBar size={18} />,
    amount_per: <IconScale size={18} />
  };
  return icons[key as keyof typeof icons] || <IconLeaf size={18} />;
};
