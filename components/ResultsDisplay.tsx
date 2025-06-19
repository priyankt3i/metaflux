
import React from 'react';
import { CalculatedMetrics, BMICategory } from '../types';

interface ResultsDisplayProps {
  metrics: CalculatedMetrics | null;
}

const getBMICategoryColor = (category: BMICategory) => {
  switch (category) {
    case BMICategory.UNDERWEIGHT: return 'text-blue-400';
    case BMICategory.NORMAL: return 'text-green-400';
    case BMICategory.OVERWEIGHT: return 'text-yellow-400';
    case BMICategory.OBESE: return 'text-red-400';
    default: return 'text-slate-100';
  }
};

const MetricCard: React.FC<{title: string, value: string | number, unit?: string, subValue?: string, valueColor?: string}> = ({ title, value, unit, subValue, valueColor }) => (
    <div className="bg-slate-700 p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
        <h3 className="text-lg font-semibold text-sky-400 mb-1">{title}</h3>
        <p className={`text-3xl font-bold ${valueColor || 'text-slate-100'}`}>{value} <span className="text-base font-normal text-slate-400">{unit}</span></p>
        {subValue && <p className={`text-sm ${valueColor || 'text-slate-300'} mt-1`}>{subValue}</p>}
    </div>
);


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ metrics }) => {
  if (!metrics) {
    return null; 
  }

  return (
    <div className="my-8 p-6 bg-slate-800 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-center mb-6 text-sky-400">Your Health Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
            title="Age"
            value={metrics.age}
            unit="years"
        />
        <MetricCard 
            title="BMI"
            value={metrics.bmi.value}
            subValue={metrics.bmi.category}
            valueColor={getBMICategoryColor(metrics.bmi.category)}
        />
        <MetricCard 
            title="BMR"
            value={Math.round(metrics.bmr)}
            unit="calories/day"
            subValue="Basal Metabolic Rate"
        />
        <MetricCard 
            title="TDEE"
            value={Math.round(metrics.tdee)}
            unit="calories/day"
            subValue="Total Daily Energy Expenditure"
        />
      </div>
    </div>
  );
};

export default ResultsDisplay;
