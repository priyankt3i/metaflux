
import React, { useState, useCallback, useEffect } from 'react';
import { UserData, Gender, ActivityLevel, UnitSystem, DietPreference, KnownAllergen } from '../types';
import { MIN_AGE, MAX_AGE, MIN_HEIGHT_CM, MAX_HEIGHT_CM, MIN_WEIGHT_KG, MAX_WEIGHT_KG, INCH_TO_CM, LB_TO_KG, CM_TO_INCH, KG_TO_LB, FEET_TO_INCHES } from '../constants';
import UnitToggle from './UnitToggle';
import { BoltIcon } from './icons';

interface InputFormProps {
  onSubmit: (data: UserData) => void;
  isLoading: boolean;
  initialData?: Partial<UserData>;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, initialData }) => {
  const [dob, setDob] = useState(initialData?.dob || '');
  const [gender, setGender] = useState<Gender>(initialData?.gender || Gender.MALE);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialData?.activityLevel || ActivityLevel.MODERATELY_ACTIVE);
  const [dietPreference, setDietPreference] = useState<DietPreference>(initialData?.dietPreference || DietPreference.NONE);
  const [selectedAllergens, setSelectedAllergens] = useState<KnownAllergen[]>(initialData?.allergies || []);
  const [customAllergies, setCustomAllergies] = useState<string>(initialData?.customAllergies || '');
  
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(UnitSystem.METRIC);
  
  // Metric units state
  const [heightCm, setHeightCm] = useState<number>(initialData?.heightCm || 170);
  const [weightKg, setWeightKg] = useState<number>(initialData?.weightKg || 70);

  // Imperial units state (for display and input convenience)
  const [heightFt, setHeightFt] = useState<string>('5');
  const [heightIn, setHeightIn] = useState<string>('7');
  const [weightLbs, setWeightLbs] = useState<string>('154');

  const [error, setError] = useState<string>('');

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const minDate = new Date(today.getFullYear() - MAX_AGE, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  
  const convertToMetric = useCallback(() => {
    if (unitSystem === UnitSystem.IMPERIAL) {
        const ft = parseFloat(heightFt) || 0;
        const inches = parseFloat(heightIn) || 0;
        const totalInches = ft * FEET_TO_INCHES + inches;
        setHeightCm(Math.round(totalInches * INCH_TO_CM));

        const lbs = parseFloat(weightLbs) || 0;
        setWeightKg(parseFloat((lbs * LB_TO_KG).toFixed(1)));
    }
  }, [unitSystem, heightFt, heightIn, weightLbs]);

  const convertToImperial = useCallback(() => {
    if (unitSystem === UnitSystem.METRIC) {
        const totalInches = heightCm * CM_TO_INCH;
        const ft = Math.floor(totalInches / FEET_TO_INCHES);
        const inches = Math.round(totalInches % FEET_TO_INCHES);
        setHeightFt(ft.toString());
        setHeightIn(inches.toString());

        setWeightLbs(Math.round(weightKg * KG_TO_LB).toString());
    }
  }, [unitSystem, heightCm, weightKg]);

  useEffect(() => {
    if (initialData?.heightCm && initialData?.weightKg) {
      setHeightCm(initialData.heightCm);
      setWeightKg(initialData.weightKg);
       if (unitSystem === UnitSystem.IMPERIAL) {
          const totalInches = initialData.heightCm * CM_TO_INCH;
          const ft = Math.floor(totalInches / FEET_TO_INCHES);
          const inches = Math.round(totalInches % FEET_TO_INCHES);
          setHeightFt(ft.toString());
          setHeightIn(inches.toString());
          setWeightLbs(Math.round(initialData.weightKg * KG_TO_LB).toString());
       } else {
           const totalInches = initialData.heightCm * CM_TO_INCH;
           const ft = Math.floor(totalInches / FEET_TO_INCHES);
           const inches = Math.round(totalInches % FEET_TO_INCHES);
           setHeightFt(ft.toString());
           setHeightIn(inches.toString());
           setWeightLbs(Math.round(initialData.weightKg * KG_TO_LB).toString());
       }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.heightCm, initialData?.weightKg]); 

  useEffect(() => {
    if (initialData?.dietPreference) {
      setDietPreference(initialData.dietPreference);
    }
    if (initialData?.allergies) {
      setSelectedAllergens(initialData.allergies);
    }
    if (initialData?.customAllergies) {
      setCustomAllergies(initialData.customAllergies);
    }
  }, [initialData?.dietPreference, initialData?.allergies, initialData?.customAllergies]);


  useEffect(() => {
    if (unitSystem === UnitSystem.METRIC) {
      convertToImperial(); 
    } else {
      convertToMetric(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [unitSystem]); 


  const handleUnitToggle = (system: UnitSystem) => {
    setUnitSystem(system);
  };
  
  const validateInputs = () => {
    if (!dob) return "Date of Birth is required.";
    
    let currentHeightCm = heightCm;
    let currentWeightKg = weightKg;

    if (unitSystem === UnitSystem.IMPERIAL) {
        const ft = parseFloat(heightFt) || 0;
        const currentInches = parseFloat(heightIn) || 0;
        const totalInches = ft * FEET_TO_INCHES + currentInches;
        currentHeightCm = totalInches * INCH_TO_CM;

        const lbs = parseFloat(weightLbs) || 0;
        currentWeightKg = lbs * LB_TO_KG;
    }

    if (currentHeightCm < MIN_HEIGHT_CM || currentHeightCm > MAX_HEIGHT_CM) return `Height must be between ${MIN_HEIGHT_CM}cm (${(MIN_HEIGHT_CM * CM_TO_INCH / FEET_TO_INCHES).toFixed(1)}ft) and ${MAX_HEIGHT_CM}cm (${(MAX_HEIGHT_CM * CM_TO_INCH / FEET_TO_INCHES).toFixed(1)}ft).`;
    if (currentWeightKg < MIN_WEIGHT_KG || currentWeightKg > MAX_WEIGHT_KG) return `Weight must be between ${MIN_WEIGHT_KG}kg (${(MIN_WEIGHT_KG * KG_TO_LB).toFixed(1)}lbs) and ${MAX_WEIGHT_KG}kg (${(MAX_WEIGHT_KG * KG_TO_LB).toFixed(1)}lbs).`;
    return "";
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');

    let finalHeightCm = heightCm;
    let finalWeightKg = weightKg;

    if (unitSystem === UnitSystem.IMPERIAL) {
      const ft = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      finalHeightCm = (ft * FEET_TO_INCHES + inches) * INCH_TO_CM;
      finalWeightKg = (parseFloat(weightLbs) || 0) * LB_TO_KG;
    }
    
    onSubmit({ 
        dob, 
        gender, 
        heightCm: Math.round(finalHeightCm), 
        weightKg: parseFloat(finalWeightKg.toFixed(1)), 
        activityLevel, 
        dietPreference,
        allergies: selectedAllergens,
        customAllergies: customAllergies.trim() 
    });
  };

  const handleAllergenChange = (allergen: KnownAllergen) => {
    setSelectedAllergens(prev => 
      prev.includes(allergen) 
        ? prev.filter(a => a !== allergen) 
        : [...prev, allergen]
    );
  };

  const inputClass = "w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors placeholder-slate-400";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";
  const checkboxLabelClass = "flex items-center space-x-2 text-slate-200 cursor-pointer";
  const checkboxClass = "h-4 w-4 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500 cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl">
      {error && <div className="p-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg text-sm" role="alert">{error}</div>}
      
      <div className="flex justify-end mb-4">
        <UnitToggle currentUnitSystem={unitSystem} onToggle={handleUnitToggle} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="dob" className={labelClass}>Date of Birth</label>
          <input type="date" id="dob" value={dob} onChange={(e) => setDob(e.target.value)} required max={maxDate} min={minDate} className={inputClass} aria-describedby="dob-constraints"/>
          <p id="dob-constraints" className="sr-only">Date must be between {minDate} and {maxDate}.</p>
        </div>
        <div>
          <label htmlFor="gender" className={labelClass}>Gender</label>
          <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={inputClass}>
            {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {unitSystem === UnitSystem.METRIC ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="heightCm" className={labelClass}>Height (cm)</label>
            <input type="number" id="heightCm" value={heightCm} onChange={(e) => setHeightCm(parseFloat(e.target.value))} required min={MIN_HEIGHT_CM} max={MAX_HEIGHT_CM} step="0.1" className={inputClass} aria-describedby="heightCm-constraints"/>
            <p id="heightCm-constraints" className="sr-only">Height must be between {MIN_HEIGHT_CM} and {MAX_HEIGHT_CM} cm.</p>
          </div>
          <div>
            <label htmlFor="weightKg" className={labelClass}>Weight (kg)</label>
            <input type="number" id="weightKg" value={weightKg} onChange={(e) => setWeightKg(parseFloat(e.target.value))} required min={MIN_WEIGHT_KG} max={MAX_WEIGHT_KG} step="0.1" className={inputClass} aria-describedby="weightKg-constraints"/>
            <p id="weightKg-constraints" className="sr-only">Weight must be between {MIN_WEIGHT_KG} and {MAX_WEIGHT_KG} kg.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="heightFt" className={labelClass}>Height (ft and inches)</label>
                <div className="flex space-x-2">
                    <input type="number" id="heightFt" aria-label="Height in feet" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} required min="1" max="8" step="1" className={`${inputClass} w-1/2`} placeholder="ft"/>
                    <input type="number" id="heightIn" aria-label="Height in inches" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} required min="0" max="11" step="0.1" className={`${inputClass} w-1/2`} placeholder="in"/>
                </div>
            </div>
            <div>
                <label htmlFor="weightLbs" className={labelClass}>Weight (lbs)</label>
                <input type="number" id="weightLbs" value={weightLbs} onChange={(e) => setWeightLbs(e.target.value)} required min={Math.round(MIN_WEIGHT_KG * KG_TO_LB)} max={Math.round(MAX_WEIGHT_KG * KG_TO_LB)} step="0.1" className={inputClass} aria-describedby="weightLbs-constraints"/>
                 <p id="weightLbs-constraints" className="sr-only">Weight must be between {Math.round(MIN_WEIGHT_KG * KG_TO_LB)} and {Math.round(MAX_WEIGHT_KG * KG_TO_LB)} lbs.</p>
            </div>
        </div>
      )}

      <div>
        <label htmlFor="activityLevel" className={labelClass}>Physical Activity Level</label>
        <select id="activityLevel" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)} className={inputClass}>
          {Object.values(ActivityLevel).map(level => <option key={level} value={level}>{level}</option>)}
        </select>
      </div>
      
      <div>
        <label htmlFor="dietPreference" className={labelClass}>Dietary Preference</label>
        <select 
            id="dietPreference" 
            value={dietPreference} 
            onChange={(e) => setDietPreference(e.target.value as DietPreference)} 
            className={inputClass}
        >
          {Object.values(DietPreference).map(prefValue => (
            <option key={prefValue} value={prefValue}>
              {prefValue}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className={labelClass}>Food Allergies (Optional)</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
          {Object.values(KnownAllergen).map(allergen => (
            <div key={allergen}>
              <label htmlFor={`allergen-${allergen}`} className={checkboxLabelClass}>
                <input
                  type="checkbox"
                  id={`allergen-${allergen}`}
                  value={allergen}
                  checked={selectedAllergens.includes(allergen)}
                  onChange={() => handleAllergenChange(allergen)}
                  className={checkboxClass}
                />
                <span>{allergen}</span>
              </label>
            </div>
          ))}
        </div>
        <div>
          <label htmlFor="customAllergies" className={`${labelClass} mt-3`}>Other Allergies (comma-separated)</label>
          <input
            type="text"
            id="customAllergies"
            value={customAllergies}
            onChange={(e) => setCustomAllergies(e.target.value)}
            className={inputClass}
            placeholder="e.g., strawberries, kiwi, cinnamon"
          />
        </div>
      </div>


      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full flex items-center justify-center p-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed text-lg"
      >
        {isLoading ? (
          <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div> Processing...</>
        ) : (
          <><BoltIcon className="w-5 h-5 mr-2" /> Calculate & Generate Plans</>
        )}
      </button>
    </form>
  );
};

export default InputForm;