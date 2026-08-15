"use client";

import { useLanguage } from '../context/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-6 right-6 z-50 flex bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-2xl">
      <button
        onClick={() => setLanguage('EN')}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
          language === 'EN' 
            ? 'bg-indigo-600 text-white shadow-lg' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('ES')}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
          language === 'ES' 
            ? 'bg-indigo-600 text-white shadow-lg' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        ES
      </button>
    </div>
  );
}
