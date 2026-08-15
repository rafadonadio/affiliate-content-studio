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
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to connect to the payment gateway.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-indigo-500/30">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full border-b border-white/10">
        <div className="flex items-center gap-2 text-xl font-bold">
          <span className="text-indigo-500">Jarvis</span> Pro
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {/* Basic Plan */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col">
            <h3 className="text-2xl font-bold mb-2">{t.paywall.basicPlan}</h3>
            <div className="text-4xl font-bold mb-6">$29<span className="text-lg text-gray-400 font-normal">{t.paywall.month}</span></div>
            <ul className="space-y-4 mb-8 text-left text-gray-300 flex-1">
              {t.paywall.basicFeatures.map((f, i) => (
                <li key={i} className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500" /> {f}</li>
              ))}
            </ul>
            <button 
              onClick={handleSubscribe} 
              disabled={loading}
              className="w-full py-3 rounded-lg border border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all font-semibold"
            >
              {t.paywall.getStarted}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl border-2 border-indigo-500 bg-indigo-500/10 p-8 flex flex-col relative transform scale-105">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center">
              <Star className="h-4 w-4 mr-1" /> {t.paywall.mostPopular}
            </div>
            <h3 className="text-2xl font-bold mb-2">{t.paywall.proPlan}</h3>
            <div className="text-4xl font-bold mb-6">$79<span className="text-lg text-gray-400 font-normal">{t.paywall.month}</span></div>
            <ul className="space-y-4 mb-8 text-left text-gray-300 flex-1">
              {t.paywall.proFeatures.map((f, i) => (
                <li key={i} className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500" /> {f}</li>
              ))}
            </ul>
            <button 
              onClick={handleSubscribe} 
              disabled={loading}
              className="w-full py-3 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all font-bold shadow-lg shadow-indigo-500/25"
            >
              {loading ? t.paywall.redirecting : t.paywall.upgradeToPro}
            </button>
          </div>

          {/* Agency Plan */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col">
            <h3 className="text-2xl font-bold mb-2">{t.paywall.agencyPlan}</h3>
            <div className="text-4xl font-bold mb-6">$199<span className="text-lg text-gray-400 font-normal">{t.paywall.month}</span></div>
            <ul className="space-y-4 mb-8 text-left text-gray-300 flex-1">
              {t.paywall.agencyFeatures.map((f, i) => (
                <li key={i} className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500" /> {f}</li>
              ))}
            </ul>
            <button 
              onClick={handleSubscribe} 
              disabled={loading}
              className="w-full py-3 rounded-lg border border-white/20 hover:bg-white/10 transition-all font-semibold"
            >
              {t.paywall.contactSales}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
