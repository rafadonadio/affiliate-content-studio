/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LayoutDashboard, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';
import PlatformSettings from './components/PlatformSettings';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'settings'>('dashboard');

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <nav className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold">Affiliate Content Studio</h1>
            <div className="flex gap-4">
              <button 
                onClick={() => setView('dashboard')}
                className={`p-2 rounded-full ${view === 'dashboard' ? 'bg-neutral-100' : 'hover:bg-neutral-100'}`}
              >
                <LayoutDashboard size={20}/>
              </button>
              <button 
                onClick={() => setView('settings')}
                className={`p-2 rounded-full ${view === 'settings' ? 'bg-neutral-100' : 'hover:bg-neutral-100'}`}
              >
                <Settings size={20}/>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' ? <Dashboard /> : <PlatformSettings />}
      </main>
    </div>
  );
}
