import React from 'react';
import { useLanguage } from './LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-neutral-900/50 backdrop-blur border border-white/10 rounded-full p-1">
      <Globe size={16} className="text-neutral-400 ml-2" />
      <div className="flex bg-black/50 rounded-full p-0.5">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            language === 'en' 
              ? 'bg-indigo-500 text-white shadow-sm' 
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('es')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            language === 'es' 
              ? 'bg-indigo-500 text-white shadow-sm' 
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          ES
        </button>
      </div>
    </div>
  );
}
