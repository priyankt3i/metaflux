
import React, { useState, useCallback, useEffect } from 'react';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import PlanDisplay from './components/PlanDisplay';
import ChatWithPlan from './components/ChatWithPlan'; // Import ChatWithPlan
import { UserData, CalculatedMetrics, ExercisePlan, DietPlan, DietPreference, KnownAllergen } from './types';
import { performCalculations } from './services/calculationService';
import { generateExercisePlan, generateDietPlan, resetChatSession } from './services/geminiService'; // Import resetChatSession

const App: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [calculatedMetrics, setCalculatedMetrics] = useState<CalculatedMetrics | null>(null);
  const [exercisePlan, setExercisePlan] = useState<ExercisePlan | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [initialFormData, setInitialFormData] = useState<Partial<UserData> | undefined>(undefined);

  useEffect(() => {
    const savedData = localStorage.getItem('healthPlannerData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as Partial<UserData>; 

        let finalDietPreference: DietPreference;
        if (parsedData.dietPreference) {
          const dietPrefFromStorage = parsedData.dietPreference as string; 
          const enumKeys = Object.keys(DietPreference) as Array<keyof typeof DietPreference>;
          const enumValues = Object.values(DietPreference) as Array<DietPreference>;

          if (enumValues.includes(dietPrefFromStorage as DietPreference)) {
            finalDietPreference = dietPrefFromStorage as DietPreference;
          } else if (enumKeys.includes(dietPrefFromStorage as keyof typeof DietPreference)) {
            finalDietPreference = DietPreference[dietPrefFromStorage as keyof typeof DietPreference];
          } else {
            finalDietPreference = DietPreference.NONE;
          }
        } else {
          finalDietPreference = DietPreference.NONE;
        }

        let finalAllergies: KnownAllergen[] = [];
        if (parsedData.allergies && Array.isArray(parsedData.allergies)) {
            finalAllergies = parsedData.allergies.filter(allergen => 
                Object.values(KnownAllergen).includes(allergen as KnownAllergen)
            ) as KnownAllergen[];
        }
        
        const migratedUserData: Partial<UserData> = {
            ...parsedData,
            dietPreference: finalDietPreference,
            allergies: finalAllergies,
            customAllergies: typeof parsedData.customAllergies === 'string' ? parsedData.customAllergies : '',
        };
        setInitialFormData(migratedUserData);
      } catch (e) {
        console.error("Failed to parse or migrate saved data from localStorage", e);
        localStorage.removeItem('healthPlannerData'); 
      }
    }
  }, []);


  const handleFormSubmit = useCallback(async (data: UserData) => {
    setIsLoading(true);
    setError(null);
    setUserData(data); 
    setExercisePlan(null); 
    setDietPlan(null);
    resetChatSession(); // Reset chat session when new plans are requested

    try {
        const dataToSave: UserData = {
            ...data,
            allergies: data.allergies || [],
            customAllergies: data.customAllergies || '',
        };
        localStorage.setItem('healthPlannerData', JSON.stringify(dataToSave));
    } catch (e) {
        console.error("Failed to save data to localStorage", e);
    }

    const metrics = performCalculations(data);
    setCalculatedMetrics(metrics);

    if (metrics) {
      try {
        // Clear previous errors specifically for plan generation
        setError(null); 
        
        const [exerciseResult, dietResult] = await Promise.allSettled([
          generateExercisePlan(data, metrics),
          generateDietPlan(data, metrics) 
        ]);

        let currentErrors: string[] = [];

        if (exerciseResult.status === 'fulfilled') {
          setExercisePlan(exerciseResult.value);
          if (!exerciseResult.value || !exerciseResult.value.exercisePlan || exerciseResult.value.exercisePlan.length === 0) {
            console.warn("Exercise plan generation returned empty, null, or malformed.", exerciseResult.value);
          }
        } else {
          console.error("Failed to generate exercise plan:", exerciseResult.reason);
          currentErrors.push(`Failed to generate exercise plan: ${(exerciseResult.reason as Error).message || 'Unknown error'}`);
        }

        if (dietResult.status === 'fulfilled') {
          setDietPlan(dietResult.value);
           if (!dietResult.value || !dietResult.value.dietPlan || dietResult.value.dietPlan.length === 0) {
            console.warn("Diet plan generation returned empty, null, or malformed.", dietResult.value);
           }
        } else {
          console.error("Failed to generate diet plan:", dietResult.reason);
          currentErrors.push(`Failed to generate diet plan: ${(dietResult.reason as Error).message || 'Unknown error'}`);
        }

        if (currentErrors.length > 0) {
            setError(currentErrors.join('\n'));
        }

      } catch (apiError: any) { 
        console.error("Error fetching plans from API:", apiError);
        setError(`An error occurred while generating plans: ${apiError.message || 'Unknown API error'}. Please ensure your API key is correctly configured if this persists.`);
      }
    } else {
      setError("Could not calculate health metrics. Please check your inputs.");
    }
    setIsLoading(false);
  }, []);

  const showChat = !isLoading && (exercisePlan || dietPlan) && userData && calculatedMetrics;

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 flex flex-col items-center">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 py-2">
          MetaFlux
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Get personalized health insights and AI-powered fitness & diet plans.
        </p>
      </header>

      <main className="w-full max-w-3xl">
        <InputForm onSubmit={handleFormSubmit} isLoading={isLoading} initialData={initialFormData} />
        {error && (
          <div role="alert" aria-live="assertive" className="mt-6 p-4 bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg whitespace-pre-line">
            <h3 className="font-semibold text-red-200 mb-1">Error Generating Plans:</h3>
            {error.split('\n').map((line, index) => <p key={index} className="text-sm">{line}</p>)}
          </div>
        )}
        {calculatedMetrics && <ResultsDisplay metrics={calculatedMetrics} />}
        
        {(isLoading || exercisePlan || dietPlan) && ( // Show PlanDisplay container if overall loading OR any plan exists
             <PlanDisplay 
                exercisePlanData={exercisePlan} 
                dietPlanData={dietPlan} 
                isOverallPlansSectionLoading={isLoading && (!exercisePlan && !dietPlan)} 
            />
        )}

        {showChat && userData && calculatedMetrics && (
          <ChatWithPlan
            key={`${userData.dob}-${calculatedMetrics.tdee}-${(exercisePlan ? 'exTrue' : 'exFalse')}-${(dietPlan ? 'dtTrue' : 'dtFalse')}`} // More specific key
            userData={userData}
            calculatedMetrics={calculatedMetrics}
            initialExercisePlan={exercisePlan}
            initialDietPlan={dietPlan}
          />
        )}
      </main>
      <footer className="mt-12 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} MetaFlux. Powered by Gemini API.</p>
        <p className="mt-1">Disclaimer: This tool provides general fitness and diet suggestions. Consult with a healthcare professional before making any significant changes to your lifestyle.</p>
      </footer>
    </div>
  );
};

export default App;
