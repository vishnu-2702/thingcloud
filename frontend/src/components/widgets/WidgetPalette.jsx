// ============================================================================
// WIDGET PALETTE MODAL
// ============================================================================
import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { WIDGET_TYPES } from './constants';

const WidgetPalette = ({ onSelect, onClose }) => {
  const categories = useMemo(() => {
    const cats = {};
    WIDGET_TYPES.forEach(w => {
      if (!cats[w.category]) cats[w.category] = [];
      cats[w.category].push(w);
    });
    return cats;
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-neutral-200 dark:border-neutral-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Add Widget</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Choose a widget to add to your dashboard</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {Object.entries(categories).map(([category, widgets]) => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">{category}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {widgets.map(widget => (
                  <button
                    key={widget.type}
                    onClick={() => onSelect(widget)}
                    className="flex flex-col items-center gap-2 p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center group-hover:border-neutral-400 transition-colors">
                      <widget.icon size={24} className="text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm text-neutral-900 dark:text-white">{widget.name}</p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">{widget.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WidgetPalette;
