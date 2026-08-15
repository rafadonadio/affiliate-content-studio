"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'EN' | 'ES';

interface Dictionary {
  [key: string]: {
    EN: string;
    ES: string;
  };
}

const DICTIONARY: Dictionary = {
  heroTitle: {
    EN: "Automate Your Affiliate Empire",
    ES: "Automatiza Tu Imperio de Afiliados"
  },
  heroSubtitle: {
    EN: "The ultimate command center for Amazon, Pinterest, and Instagram. Powered by Jarvis AI.",
    ES: "El centro de comando definitivo para Amazon, Pinterest e Instagram. Potenciado por Jarvis AI."
  },
  downloadButton: {
    EN: "Download for Windows",
    ES: "Descargar para Windows"
  },
  versionText: {
    EN: "Latest Version • Free to start",
    ES: "Última Versión • Gratis para empezar"
  },
  featuresTitle: {
    EN: "Why Choose Affiliate Content Studio?",
    ES: "¿Por qué elegir Affiliate Content Studio?"
  },
  feature1Title: {
    EN: "AI-Powered Generation",
    ES: "Generación con Inteligencia Artificial"
  },
  feature1Desc: {
    EN: "Generate SEO-optimized captions and AI images automatically.",
    ES: "Genera descripciones optimizadas para SEO e imágenes con IA automáticamente."
  },
  feature2Title: {
    EN: "Auto-Publishing",
    ES: "Publicación Automática"
  },
  feature2Desc: {
    EN: "Schedule and auto-post to Pinterest, Instagram, and YouTube.",
    ES: "Programa y publica automáticamente en Pinterest, Instagram y YouTube."
  },
  feature3Title: {
    EN: "Jarvis Voice Assistant",
    ES: "Asistente de Voz Jarvis"
  },
  feature3Desc: {
    EN: "Control everything via voice or WhatsApp commands.",
    ES: "Controla todo mediante comandos de voz o WhatsApp."
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof DICTIONARY) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('EN');

  const t = (key: keyof typeof DICTIONARY) => {
    return DICTIONARY[key][language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
