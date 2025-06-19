
export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum ActivityLevel {
  SEDENTARY = 'Sedentary (little or no exercise)',
  LIGHTLY_ACTIVE = 'Lightly active (light exercise/sports 1-3 days/week)',
  MODERATELY_ACTIVE = 'Moderately active (moderate exercise/sports 3-5 days/week)',
  VERY_ACTIVE = 'Very active (hard exercise/sports 6-7 days a week)',
  SUPER_ACTIVE = 'Super active (very hard exercise/physical job & exercise 2x/day)',
}

export enum UnitSystem {
  METRIC = 'metric',
  IMPERIAL = 'imperial',
}

export enum DietPreference {
  NONE = 'None (No specific preference)',
  VEGAN = 'Vegan (No animal products at all)',
  VEGETARIAN = 'Vegetarian (No meat, poultry, or fish)',
  PESCATARIAN = 'Pescatarian (Vegetarian, but includes seafood)',
  POLLOTARIAN = 'Pollotarian (No red meat or fish, only poultry)',
  CARNIVORE = 'Carnivore (Primarily meat, fish, eggs; minimal plants)',
}

export enum KnownAllergen {
  PEANUTS = "Peanuts",
  DAIRY = "Dairy (Milk, Cheese, Yogurt)",
  GLUTEN = "Gluten (Wheat, Barley, Rye)",
  SHELLFISH = "Shellfish (Shrimp, Crab, Lobster)",
  SOY = "Soy (Soybeans, Tofu, Soy Milk)",
  EGGS = "Eggs",
  TREE_NUTS = "Tree Nuts (Almonds, Walnuts, Cashews, etc.)",
  FISH = "Fish (e.g., Salmon, Tuna, Cod)",
  SESAME = "Sesame Seeds",
  MUSTARD = "Mustard",
  CELERY = "Celery",
  SULPHITES = "Sulphites/Sulfites (often in dried fruits, wine)",
}


export interface UserData {
  dob: string; // YYYY-MM-DD
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  dietPreference: DietPreference;
  allergies: KnownAllergen[];
  customAllergies: string; // Comma-separated string for other allergies
}

export enum BMICategory {
  UNDERWEIGHT = 'Underweight',
  NORMAL = 'Normal weight',
  OVERWEIGHT = 'Overweight',
  OBESE = 'Obese',
}

export interface CalculatedMetrics {
  age: number;
  bmi: {
    value: number;
    category: BMICategory;
  };
  bmr: number;
  tdee: number;
}

export interface Exercise {
  name: string;
  duration: string; // e.g., "30 minutes", "3 sets of 10-12 reps"
  intensity: string; // e.g., "Moderate", "High"
}

export interface ExerciseDay {
  day: string; // e.g., "Monday", "Day 1"
  focus: string; // e.g., "Cardio", "Strength Training - Upper Body"
  exercises: Exercise[];
  notes?: string;
}

export interface ExercisePlan {
  exercisePlan: ExerciseDay[];
}

export interface Meal {
  name: string; // e.g., "Breakfast", "Lunch"
  description: string;
  estimatedCalories: number;
}

export interface DietDay {
  day: string; // e.g., "Monday", "Day 1"
  totalCalories: number;
  meals: Meal[];
  macronutrients?: { // Optional
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
  };
}

export interface DietPlan {
  dietPlan: DietDay[];
}

export interface ChatMessage {
  id: string; // Unique ID for each message for React keys
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}
