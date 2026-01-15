export interface Dish {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image_url: string;
  tags?: string[];
  created_at?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  is_admin: boolean;
  avatar_url?: string;
}

export interface Review {
  id: string;
  user_id: string;
  dish_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user?: {
    username: string;
  };
}

export interface NutritionalGoal {
  user_id: string;
  daily_calories: number;
  min_veggies: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
}

export interface MealRecord {
  id: string;
  user_id: string;
  user_name?: string;
  dish_id?: string;
  dish_name: string;
  nutrition_value: string;
  calories: number;
  reason: string;
  is_selected: boolean;
  selected_at: string;
  evaluation?: string;
}
