
import { ActivityLevel, BMICategory } from './types';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHTLY_ACTIVE]: 1.375,
  [ActivityLevel.MODERATELY_ACTIVE]: 1.55,
  [ActivityLevel.VERY_ACTIVE]: 1.725,
  [ActivityLevel.SUPER_ACTIVE]: 1.9,
};

export const BMI_THRESHOLDS = {
  UNDERWEIGHT_MAX: 18.5,
  NORMAL_MAX: 24.9,
  OVERWEIGHT_MAX: 29.9,
};

export const GEMINI_TEXT_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const MIN_AGE = 15;
export const MAX_AGE = 90;
export const MIN_HEIGHT_CM = 100;
export const MAX_HEIGHT_CM = 250;
export const MIN_WEIGHT_KG = 30;
export const MAX_WEIGHT_KG = 300;

export const INCH_TO_CM = 2.54;
export const LB_TO_KG = 0.453592;
export const CM_TO_INCH = 1 / INCH_TO_CM;
export const KG_TO_LB = 1 / LB_TO_KG;
export const FEET_TO_INCHES = 12;
