"use client";

import { useLanguage } from '../context/LanguageContext';

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-4">
      {/* Background glowing orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8 backdrop-blur-sm animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          {t('versionText')}
        </div>

        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-8 leading-tight animate-fade-in-up animation-delay-100">
          {t('heroTitle').split(' ').map((word, i) => (
            word.toLowerCase() === 'afiliados' || word.toLowerCase() === 'affiliate' 
              ? <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400"> {word} </span>
              : <span key={i}> {word} </span>
          ))}
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed animate-fade-in-up animation-delay-200">
          {t('heroSubtitle')}
        </p>

        <a 
          href="/latest.exe"
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95 animate-fade-in-up animation-delay-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-cyan-100 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300" />
          <svg className="relative z-10 w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="relative z-10">{t('downloadButton')}</span>
        </a>
      </div>
    </section>
  );
}
