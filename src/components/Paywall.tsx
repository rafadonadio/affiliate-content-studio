import { API_URL } from '../config.js';
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Lock, LogOut, Check, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export default function Paywall() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('saas_token');
      const res = await fetch(API_URL + '/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(`Stripe Error: ${data.error || "Failed to connect"}`);
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-indigo-500/30">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full border-b border-white/10">
        <div className="flex items-center gap-2 text-xl font-bold">
          <span className="text-indigo-500">Studio</span> Pro
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button onClick={logout} className="flex items-center text-gray-400 hover:text-white">
            <LogOut className="h-5 w-5 mr-2" />
            {t.paywall.signOut}
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Lock className="h-16 w-16 text-indigo-500 mb-6" />
        <h1 className="text-4xl font-bold mb-4">{t.paywall.title}</h1>
        <p className="text-gray-400 max-w-lg mb-12 text-lg">
          {t.paywall.subtitle(user?.email || '')}
        </p>

        <div className="flex justify-center max-w-md w-full">
          {/* Pro Plan */}
          <div className="w-full rounded-2xl border-2 border-indigo-500 bg-indigo-500/10 p-8 flex flex-col relative transform hover:scale-105 transition-transform duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center shadow-lg">
              <Star className="h-4 w-4 mr-1" /> Premium Access
            </div>
            <h3 className="text-2xl font-bold mb-2 mt-2">{t.paywall.proPlan}</h3>
            <div className="text-4xl font-bold mb-6">$79<span className="text-lg text-gray-400 font-normal">{t.paywall.month}</span></div>
            <ul className="space-y-4 mb-8 text-left text-gray-300 flex-1">
              {t.paywall.proFeatures.map((f, i) => (
                <li key={i} className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500 flex-shrink-0" /> <span>{f}</span></li>
              ))}
            </ul>
            <button 
              onClick={handleSubscribe} 
              disabled={loading}
              className="w-full py-4 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all font-bold text-lg shadow-lg shadow-indigo-500/25 flex justify-center items-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.paywall.redirecting}
                </span>
              ) : t.paywall.upgradeToPro}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
