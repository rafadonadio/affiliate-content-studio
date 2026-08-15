import React from 'react';
import { Bot, Zap, Globe, MessageCircle, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold">
            <Zap className="h-6 w-6 text-indigo-500" fill="currentColor" />
            <span>Affiliate Content Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a 
              href="https://github.com/rafadonadio/affiliate-content-studio/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-full border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
              title="Download latest version"
            >
              {t.landing.downloadApp}
            </a>
            <button 
              onClick={onLoginClick}
              className="px-6 py-2.5 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
            >
              {t.landing.signIn}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-8 text-indigo-300">
            <Bot size={16} /> {t.landing.poweredBy}
          </div>
          <h1 
            className="text-6xl md:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent"
            dangerouslySetInnerHTML={{ __html: t.landing.title }}
          />
          <p className="text-xl md:text-2xl text-neutral-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            {t.landing.subtitle}
          </p>
          <button 
            onClick={onLoginClick}
            className="group px-8 py-4 rounded-full bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-500 transition-all flex items-center gap-2 mx-auto shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)]"
          >
            {t.landing.ctaMain}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* How it Works / Workflow */}
      <section className="py-32 px-6 border-t border-white/5 bg-neutral-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">{t.landing.workflowTitle}</h2>
            <p className="text-xl text-neutral-400">{t.landing.workflowSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors">
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <Globe size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t.landing.step1Title}</h3>
              <p className="text-neutral-400 leading-relaxed">
                {t.landing.step1Desc}
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Bot size={120} />
              </div>
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <LayoutDashboard size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t.landing.step2Title}</h3>
              <p className="text-neutral-400 leading-relaxed relative z-10">
                {t.landing.step2Desc}
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors">
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <MessageCircle size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{t.landing.step3Title}</h3>
              <p className="text-neutral-400 leading-relaxed">
                {t.landing.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer CTA */}
      <section className="py-32 px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">{t.landing.ctaFooter}</h2>
        <button 
          onClick={onLoginClick}
          className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-neutral-200 transition-colors"
        >
          {t.landing.ctaFooterBtn}
        </button>
      </section>
    </div>
  );
}
