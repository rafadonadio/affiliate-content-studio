import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

interface SubscriptionStatus {
  status: string;
  plan: string;
  current_period_end: string;
}

export function BillingSettings() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stripe/status')
      .then(res => res.json())
      .then(data => {
        setSubscription(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch subscription status', err);
        setLoading(false);
      });
  }, []);

  const handleSubscribe = async () => {
    try {
      const res = await fetch('/api/stripe/create-checkout-session', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout failed', err);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/stripe/create-portal-session', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Portal failed', err);
    }
  };

  if (loading) {
    return <div className="animate-pulse flex h-32 bg-gray-800/50 rounded-xl"></div>;
  }

  const isActive = subscription?.status === 'active';

  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm max-w-2xl mx-auto mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <CreditCard className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Billing & Subscription</h2>
      </div>

      <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-neutral-900">
              {isActive ? 'Pro Plan' : 'Free Plan'}
            </h3>
            {isActive ? (
              <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3 h-3" />
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500 max-w-sm">
            {isActive 
              ? `Your subscription is active until ${new Date(subscription.current_period_end).toLocaleDateString()}.`
              : 'Upgrade to the Pro Plan to unlock the Assistant and unlimited automated generations.'}
          </p>
        </div>

        <div>
          {isActive ? (
            <button
              onClick={handleManageBilling}
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-md transition-all duration-200 text-sm"
            >
              Manage Billing
            </button>
          ) : (
            <button
              onClick={handleSubscribe}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-all duration-200 text-sm shadow-sm shadow-indigo-500/30"
            >
              Upgrade to Pro - $79/mo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
