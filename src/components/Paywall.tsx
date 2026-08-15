import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Lock, LogOut, Check, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function Paywall() {
  const { user, logout } = useAuth();
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      <nav className="p-6 flex justify-between items-center border-b border-white/10">
        <div className="font-bold text-xl flex items-center">
          <Zap className="mr-2 h-6 w-6 text-indigo-500" />
          Affiliate Content Studio
        </div>
        <button onClick={logout} className="flex items-center text-gray-400 hover:text-white">
          <LogOut className="h-5 w-5 mr-2" />
          Sign Out
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Lock className="h-16 w-16 text-indigo-500 mb-6" />
        <h1 className="text-4xl font-bold mb-4">Subscription Required</h1>
        <p className="text-gray-400 max-w-lg mb-12 text-lg">
          Hi <strong>{user?.email}</strong>, your account does not have an active membership. 
          Unlock the full potential of Artificial Intelligence and automation today.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {/* Basic Plan */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col">
            <h3 className="text-2xl font-bold mb-2">Basic</h3>
            <div className="text-4xl font-bold mb-6">$29<span className="text-lg text-gray-400 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 text-left text-gray-300 flex-1">
              <li className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500" /> 100 AI Posts / month</li>
              <li className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500" /> Email Support</li>
              <li className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500" /> 1 Linked Social Account</li>
            </ul>
            <button 
              onClick={handleSubscribe} 
              disabled={loading}
              className="w-full py-3 rounded-lg border border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all font-semibold"
            >
              Get Started
            </button>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl border-2 border-indigo-500 bg-indigo-500/10 p-8 flex flex-col relative transform scale-105">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center">
              <Star className="h-4 w-4 mr-1" /> MOST POPULAR
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <div className="text-4xl font-bold mb-6">$79<span className="text-lg text-gray-400 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 text-left text-gray-300 flex-1">
              <li className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500" /> 1,000 AI Posts / month</li>
              <li className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500" /> Custom AI (Jarvis)</li>
              <li className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500" /> Full Automation</li>
            </ul>
            <button 
              onClick={handleSubscribe} 
              disabled={loading}
              className="w-full py-3 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all font-bold shadow-lg shadow-indigo-500/25"
            >
              {loading ? 'Redirecting...' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Agency Plan */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col">
            <h3 className="text-2xl font-bold mb-2">Agency</h3>
            <div className="text-4xl font-bold mb-6">$199<span className="text-lg text-gray-400 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 text-left text-gray-300 flex-1">
              <li className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500" /> Unlimited Everything</li>
              <li className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500" /> Multiple Accounts</li>
              <li className="flex items-center"><Check className="h-5 w-5 mr-2 text-indigo-500" /> White Labeling</li>
            </ul>
            <button 
              onClick={handleSubscribe} 
              disabled={loading}
              className="w-full py-3 rounded-lg border border-white/20 hover:bg-white/10 transition-all font-semibold"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
