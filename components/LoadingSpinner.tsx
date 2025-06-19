
import React from 'react';

const LoadingSpinner: React.FC<{ size?: string, message?: string }> = ({ size = 'w-8 h-8', message }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={`animate-spin rounded-full ${size} border-t-4 border-b-4 border-sky-500`}></div>
      {message && <p className="text-sm text-slate-400">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
