
import { UserData, Gender, ActivityLevel, BMICategory, CalculatedMetrics } from '../types';
import { ACTIVITY_MULTIPLIERS, BMI_THRESHOLDS } from '../constants';

export const calculateAge = (dobString: string): number => {
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const getBMICategory = (bmi: number): BMICategory => {
  if (bmi < BMI_THRESHOLDS.UNDERWEIGHT_MAX) return BMICategory.UNDERWEIGHT;
  if (bmi <= BMI_THRESHOLDS.NORMAL_MAX) return BMICategory.NORMAL;
  if (bmi <= BMI_THRESHOLDS.OVERWEIGHT_MAX) return BMICategory.OBESE; // Simplified: Overweight and Obese class 1+
  return BMICategory.OBESE;
};

export const calculateBMIValue = (weightKg: number, heightCm: number): number => {
  if (heightCm <= 0 || weightKg <=0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};


export const calculateBMR = (userData: UserData, age: number): number => {
  const { weightKg, heightCm, gender } = userData;
  if (weightKg <=0 || heightCm <=0 || age <=0) return 0;

  if (gender === Gender.MALE) {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === Gender.FEMALE) {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else { // For 'Other', average of male and female, or a neutral formula if available. Using average for now.
    const bmrMale = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    const bmrFemale = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    return (bmrMale + bmrFemale) / 2;
  }
};

export const calculateTDEE = (bmr: number, activityLevel: ActivityLevel): number => {
  if (bmr <= 0) return 0;
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
};

export const performCalculations = (userData: UserData): CalculatedMetrics | null => {
  if (!userData.dob || userData.heightCm <= 0 || userData.weightKg <= 0) {
    return null;
  }
  const age = calculateAge(userData.dob);
  const bmiValue = calculateBMIValue(userData.weightKg, userData.heightCm);
  const bmiCategory = getBMICategory(bmiValue);
  const bmr = calculateBMR(userData, age);
  const tdee = calculateTDEE(bmr, userData.activityLevel);

  return {
    age,
    bmi: { value: parseFloat(bmiValue.toFixed(1)), category: bmiCategory },
    bmr: parseFloat(bmr.toFixed(0)),
    tdee: parseFloat(tdee.toFixed(0)),
  };
};
