// ============================================================================
// COLOR PICKER COMPONENT
// ============================================================================
import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { COLOR_PRESETS } from './constants';

const ColorPicker = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      {label && (
        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 w-full border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800 transition-colors"
      >
        <div 
          className="w-6 h-6 rounded-md border border-neutral-300 dark:border-neutral-600" 
          style={{ backgroundColor: value || '#10b981' }} 
        />
        <span className="text-sm text-neutral-700 dark:text-neutral-300 font-mono flex-1 text-left">
          {value || '#10b981'}
        </span>
        <Palette size={14} className="text-neutral-400" />
      </button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0" 
            style={{ zIndex: 10 }}
            onClick={() => setIsOpen(false)} 
            onWheel={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-20 w-full">
            <div className="grid grid-cols-6 gap-2 mb-3">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange(c); setIsOpen(false); }}
                  className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                    value === c ? 'border-neutral-900 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              type="color"
              value={value || '#10b981'}
              onChange={(e) => { onChange(e.target.value); setIsOpen(false); }}
              className="w-full h-10 cursor-pointer rounded-lg border border-neutral-200 dark:border-neutral-700"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ColorPicker;
