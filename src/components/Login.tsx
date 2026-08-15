import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { Bot, Lock, LogIn } from 'lucide-react';

export function Login() {
  const { requestOtp, verifyOtp } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      await requestOtp(email);
      setStep(2);
      setMessage('Code sent! Please check your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to request code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await verifyOtp(email, code);
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
        <div className="p-8 text-center bg-neutral-900 text-white">
          <div className="mx-auto w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
            <Bot size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t.login.title}</h2>
          <p className="text-neutral-400 text-sm">{t.login.subtitle}</p>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">{t.login.email}</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-70"
              >
                {isLoading ? t.login.verifying : (
                  <>
                    <LogIn size={20} />
                    {t.login.sendCodeBtn}
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}
              {message && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-sm text-center">
                  {message}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">{t.login.code || 'Code'}</label>
                <input 
                  type="text" 
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-center tracking-[0.5em] font-mono text-lg"
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-70"
              >
                {isLoading ? t.login.verifying : (
                  <>
                    <LogIn size={20} />
                    {t.login.signInBtn}
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="w-full text-neutral-500 text-sm hover:text-neutral-700"
              >
                Go back
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-neutral-500 flex items-center justify-center gap-1">
            <Lock size={14} /> {t.login.secure}
          </div>
        </div>
      </div>
    </div>
  );
}
