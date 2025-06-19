
import React from 'react';
import { UnitSystem } from '../types';

interface UnitToggleProps {
  currentUnitSystem: UnitSystem;
  onToggle: (system: UnitSystem) => void;
}

const UnitToggle: React.FC<UnitToggleProps> = ({ currentUnitSystem, onToggle }) => {
  return (
    <div className="flex items-center space-x-2 bg-slate-700 p-1 rounded-lg">
      <button
        type="button"
        onClick={() => onToggle(UnitSystem.METRIC)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
          ${currentUnitSystem === UnitSystem.METRIC ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
      >
        Metric (kg, cm)
      </button>
      <button
        type="button"
        onClick={() => onToggle(UnitSystem.IMPERIAL)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
          ${currentUnitSystem === UnitSystem.IMPERIAL ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
      >
        Imperial (lbs, ft/in)
      </button>
    </div>
  );
};

export default UnitToggle;
