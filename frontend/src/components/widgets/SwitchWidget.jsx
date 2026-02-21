// ============================================================================
// WIDGET: SWITCH / TOGGLE
// ============================================================================
import React from 'react';

const SwitchWidget = ({ value, config = {}, onCommand }) => {
  const { 
    label = 'Switch',
    onColor = '#10b981',
    offColor = '#6b7280',
    dataKey = ''
  } = config;
  
  const isOn = value === true || value === 1 || value === '1' || value === 'on';

  const handleToggle = () => {
    if (onCommand && dataKey) {
      onCommand(dataKey, isOn ? 0 : 1);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-2">
      <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 truncate">
        {label}
      </span>
      <button
        onClick={handleToggle}
        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
          onCommand ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60'
        }`}
        style={{ backgroundColor: isOn ? onColor : offColor }}
        disabled={!onCommand}
      >
        <div 
          className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
            isOn ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default SwitchWidget;
