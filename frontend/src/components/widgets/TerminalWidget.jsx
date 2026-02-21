// ============================================================================
// WIDGET: TERMINAL / LOG
// ============================================================================
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { ChevronDown, Terminal } from 'lucide-react';

const TerminalWidget = ({ data, config = {} }) => {
  const { label = 'Terminal', maxLines = 20 } = config;
  const containerRef = useRef(null);
  const [displayLines, setDisplayLines] = useState(maxLines);
  const [showSelector, setShowSelector] = useState(false);
  
  const lineOptions = [10, 20, 30, 50, 100];
  
  const lines = useMemo(() => {
    return (data || []).slice(0, displayLines).map((entry, i) => ({
      time: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      data: JSON.stringify(entry.data)
    }));
  }, [data, displayLines]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [lines]);

  if ((data || []).length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 text-sm p-3">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-2">
          <Terminal size={22} className="opacity-50" />
        </div>
        <span className="text-xs font-medium">No data available</span>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-0.5">Waiting for datapoints</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider truncate">
          {label}
        </span>
        
        {/* Line count selector */}
        <div className="relative">
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md transition-colors"
          >
            <span>{displayLines} lines</span>
            <ChevronDown size={12} className={`transition-transform ${showSelector ? 'rotate-180' : ''}`} />
          </button>
          
          {showSelector && (
            <>
              <div 
                className="fixed inset-0" 
                style={{ zIndex: 10 }}
                onClick={() => setShowSelector(false)} 
                onWheel={() => setShowSelector(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 z-20 min-w-[80px]">
                {lineOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setDisplayLines(opt); setShowSelector(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      displayLines === opt 
                        ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                    }`}
                  >
                    {opt} lines
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Terminal content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-neutral-900 dark:bg-black rounded-lg p-2 font-mono text-xs"
      >
        {lines.map((line, i) => (
          <div key={i} className="text-neutral-300 mb-1">
            <span className="text-neutral-500">[{line.time}]</span>{' '}
            <span className="text-emerald-400">{line.data}</span>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-neutral-400 dark:text-neutral-500">
        <span>{lines.length} entries</span>
        <span className="tabular-nums">Total: {(data || []).length}</span>
      </div>
    </div>
  );
};

export default TerminalWidget;
