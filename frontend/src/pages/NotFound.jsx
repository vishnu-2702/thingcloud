import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Frown, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950 transition-colors">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Frown size={48} className="text-neutral-400 dark:text-neutral-500" />
        </div>
        
        <h1 className="text-6xl font-bold text-neutral-900 dark:text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">Page Not Found</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex items-center justify-center gap-3">
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          <Link 
            to="/app/dashboard" 
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            <Home size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
