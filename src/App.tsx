/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { LayoutDashboard, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';
import PlatformSettings from './components/PlatformSettings';
import CalendarView from './components/CalendarView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdminDashboard from './components/AdminDashboard';
import { AssistantConsole } from './components/AssistantConsole';
import { Calendar as CalendarIcon, BarChart3, ShieldCheck, LogOut } from 'lucide-react';

import { useAuth } from './components/AuthContext';
import { Login } from './components/Login';
import Paywall from './components/Paywall';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<'dashboard' | 'calendar' | 'analytics' | 'settings' | 'admin'>('dashboard');


  useEffect(() => {
    const eventSource = new EventSource('/api/notifications');
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'success') {
          toast.success(data.message);
        } else if (data.type === 'error') {
          toast.error(data.message);
        }
      } catch (err) {
        console.error('Failed to parse SSE message', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  // Intercept unpaid users (Admins bypass the paywall to configure settings)
  if (!user.hasProLicense && user.role !== 'admin') {
    return (
      <>
        <Toaster position="top-right" richColors />
        <Paywall />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Toaster position="top-right" richColors />
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
                onClick={() => setView('calendar')}
                className={`p-2 rounded-full ${view === 'calendar' ? 'bg-neutral-100' : 'hover:bg-neutral-100'}`}
              >
                <CalendarIcon size={20}/>
              </button>
              <button 
                onClick={() => setView('analytics')}
                className={`p-2 rounded-full ${view === 'analytics' ? 'bg-neutral-100 text-indigo-600' : 'hover:bg-neutral-100'}`}
              >
                <BarChart3 size={20}/>
              </button>
              <button 
                onClick={() => setView('settings')}
                className={`p-2 rounded-full ${view === 'settings' ? 'bg-neutral-100' : 'hover:bg-neutral-100'}`}
              >
                <Settings size={20}/>
              </button>
              
              {user?.role === 'admin' && (
                <button 
                  onClick={() => setView('admin')}
                  className={`p-2 rounded-full ${view === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-neutral-100 text-neutral-500'}`}
                  title="Súper Administrador"
                >
                  <ShieldCheck size={20}/>
                </button>
              )}

              <div className="w-px h-6 bg-neutral-200 self-center mx-2"></div>

              <button 
                onClick={logout}
                className="p-2 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                title="Log out"
              >
                <LogOut size={20}/>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && <Dashboard />}
        {view === 'calendar' && <CalendarView />}
        {view === 'analytics' && <AnalyticsDashboard />}
        {view === 'settings' && <PlatformSettings />}
        {view === 'admin' && <AdminDashboard />}
      </main>

      <AssistantConsole />
    </div>
  );
}
