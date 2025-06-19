
import React, { useState, useCallback, useMemo } from 'react';
import { ExercisePlan, DietPlan, ExerciseDay, DietDay } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { ClipboardIcon, CheckIcon } from './icons';

interface PlanDisplayProps {
  exercisePlanData: ExercisePlan | null;
  dietPlanData: DietPlan | null;
  isOverallPlansSectionLoading: boolean;
}

// Specific getter for exercise plan array
const getExercisePlanArray = (planData: ExercisePlan | null): ExerciseDay[] => {
  return planData?.exercisePlan || [];
};

// Specific getter for diet plan array
const getDietPlanArray = (planData: DietPlan | null): DietDay[] => {
  return planData?.dietPlan || [];
};

// Helper to format exercise plan for copy, now robust
const formatExercisePlanForCopy = (plan: ExerciseDay[]): string => {
  if (!plan || plan.length === 0) return "No exercise plan details available to copy.";
  return plan.map(day =>
    `🗓️ ${day.day} - ${day.focus}\n` +
    day.exercises.map(ex => `  - ${ex.name}: ${ex.duration} (${ex.intensity})`).join('\n') +
    (day.notes ? `\n  📝 Notes: ${day.notes}` : '')
  ).join('\n\n');
};

// Helper to format diet plan for copy, now robust
const formatDietPlanForCopy = (plan: DietDay[]): string => {
  if (!plan || plan.length === 0) return "No diet plan details available to copy.";
  return plan.map(day =>
    `🗓️ ${day.day} (~${day.totalCalories} kcal)\n` +
    (day.macronutrients ? `  Macros: P:${day.macronutrients.protein}g, C:${day.macronutrients.carbs}g, F:${day.macronutrients.fat}g\n` : '') +
    day.meals.map(meal => `  - ${meal.name} (~${meal.estimatedCalories} kcal): ${meal.description}`).join('\n')
  ).join('\n\n');
};


interface PlanSectionProps<TDay extends ExerciseDay | DietDay> {
  title: string;
  planArray: TDay[];
  renderDay: (day: TDay, index: number) => React.ReactNode;
  onCopy: () => void;
  isSectionLoading: boolean;
  copied: boolean;
}

const PlanSection = <TDay extends ExerciseDay | DietDay>({
  title,
  planArray,
  renderDay,
  onCopy,
  isSectionLoading,
  copied,
}: PlanSectionProps<TDay>) => {
  if (isSectionLoading) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl">
        <h3 className="text-2xl font-semibold mb-6 text-sky-400 text-center">{title}</h3>
        <LoadingSpinner message={`Generating ${title.toLowerCase()}...`} />
      </div>
    );
  }

  if (planArray.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-sky-400">{title}</h3>
        <button
          onClick={onCopy}
          className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center text-sm"
          title={`Copy ${title}`}
        >
          {copied ? <CheckIcon className="w-5 h-5 mr-1" /> : <ClipboardIcon className="w-5 h-5 mr-1" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="space-y-6">
        {planArray.map((day, index) => renderDay(day, index))}
      </div>
    </div>
  );
};


const PlanDisplay: React.FC<PlanDisplayProps> = ({
  exercisePlanData,
  dietPlanData,
  isOverallPlansSectionLoading,
}) => {
  const [copiedExercise, setCopiedExercise] = useState(false);
  const [copiedDiet, setCopiedDiet] = useState(false);

  const currentExercisePlanArray = useMemo(() =>
    getExercisePlanArray(exercisePlanData),
    [exercisePlanData]
  );
  const currentDietPlanArray = useMemo(() =>
    getDietPlanArray(dietPlanData),
    [dietPlanData]
  );

  const shouldRenderExercisePlan = isOverallPlansSectionLoading || currentExercisePlanArray.length > 0;
  const shouldRenderDietPlan = isOverallPlansSectionLoading || currentDietPlanArray.length > 0;

  if (!shouldRenderExercisePlan && !shouldRenderDietPlan && !isOverallPlansSectionLoading) {
    return null;
  }

  const isExerciseSectionActuallyLoading = isOverallPlansSectionLoading && currentExercisePlanArray.length === 0;
  const isDietSectionActuallyLoading = isOverallPlansSectionLoading && currentDietPlanArray.length === 0;

  const handleCopyExercise = useCallback(() => {
    if (currentExercisePlanArray.length > 0) {
      const textToCopy = `Exercise Plan\n\n${formatExercisePlanForCopy(currentExercisePlanArray)}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedExercise(true);
        setTimeout(() => setCopiedExercise(false), 2000);
      }).catch(err => console.error('Failed to copy exercise plan: ', err));
    }
  }, [currentExercisePlanArray]);

  const handleCopyDiet = useCallback(() => {
    if (currentDietPlanArray.length > 0) {
      const textToCopy = `Diet Plan\n\n${formatDietPlanForCopy(currentDietPlanArray)}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedDiet(true);
        setTimeout(() => setCopiedDiet(false), 2000);
      }).catch(err => console.error('Failed to copy diet plan: ', err));
    }
  }, [currentDietPlanArray]);


  const renderExerciseDay = (day: ExerciseDay, index: number) => (
    <div key={index} className="bg-slate-700 p-4 rounded-lg shadow">
      <h4 className="text-xl font-semibold text-sky-300">{day.day} - <span className="font-normal text-slate-200">{day.focus}</span></h4>
      <ul className="mt-2 space-y-2 list-disc list-inside pl-2 text-slate-300">
        {day.exercises.map((ex, i) => (
          <li key={i}>
            <strong>{ex.name}:</strong> {ex.duration} ({ex.intensity})
          </li>
        ))}
      </ul>
      {day.notes && <p className="mt-2 text-sm text-slate-400 italic">Notes: {day.notes}</p>}
    </div>
  );

  const renderDietDay = (day: DietDay, index: number) => (
    <div key={index} className="bg-slate-700 p-4 rounded-lg shadow">
      <h4 className="text-xl font-semibold text-sky-300">{day.day}</h4>
      <p className="text-slate-200">Total Calories: ~{day.totalCalories} kcal</p>
      {day.macronutrients && (
        <p className="text-sm text-slate-400">
          Protein: {day.macronutrients.protein}g, Carbs: {day.macronutrients.carbs}g, Fat: {day.macronutrients.fat}g
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {day.meals.map((meal, i) => (
          <li key={i} className="border-l-2 border-sky-500 pl-3 py-1">
            <strong className="text-slate-100">{meal.name}:</strong>
            <p className="text-slate-300 text-sm">{meal.description}</p>
            <p className="text-xs text-slate-400">~{meal.estimatedCalories} kcal</p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="my-8 space-y-8">
      {shouldRenderExercisePlan && (
        <PlanSection<ExerciseDay>
          title="Exercise Plan"
          planArray={currentExercisePlanArray}
          renderDay={renderExerciseDay}
          onCopy={handleCopyExercise}
          isSectionLoading={isExerciseSectionActuallyLoading}
          copied={copiedExercise}
        />
      )}
      {shouldRenderDietPlan && (
        <PlanSection<DietDay>
          title="Diet Plan"
          planArray={currentDietPlanArray}
          renderDay={renderDietDay}
          onCopy={handleCopyDiet}
          isSectionLoading={isDietSectionActuallyLoading}
          copied={copiedDiet}
        />
      )}
    </div>
  );
};

export default PlanDisplay;
