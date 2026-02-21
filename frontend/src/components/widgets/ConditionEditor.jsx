// ============================================================================
// CONDITION EDITOR COMPONENT
// ============================================================================
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ColorPicker from './ColorPicker';

const ConditionEditor = ({ conditions = [], onChange }) => {
  const addCondition = () => {
    onChange([...conditions, { operator: '>', value: 50, color: '#ef4444' }]);
  };

  const removeCondition = (index) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index, key, value) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          Conditional Colors
        </label>
        <button
          type="button"
          onClick={addCondition}
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <Plus size={14} />
          Add Rule
        </button>
      </div>
      
      {conditions.length === 0 ? (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
          No conditions. Add rules to change color based on value.
        </p>
      ) : (
        <div className="space-y-2">
          {conditions.map((cond, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">If value</span>
              <select
                value={cond.operator}
                onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                className="px-2 py-1.5 text-xs border border-neutral-200 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value=">=">&gt;=</option>
                <option value="<=">&lt;=</option>
                <option value="==">==</option>
                <option value="!=">!=</option>
              </select>
              <input
                type="number"
                value={cond.value}
                onChange={(e) => updateCondition(idx, 'value', parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1.5 text-xs border border-neutral-200 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div 
                  className="w-8 h-8 rounded-md cursor-pointer border border-neutral-300 dark:border-neutral-600"
                  style={{ backgroundColor: cond.color }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'color';
                    input.value = cond.color;
                    input.addEventListener('input', (e) => updateCondition(idx, 'color', e.target.value));
                    input.click();
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => removeCondition(idx)}
                className="p-1.5 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConditionEditor;
