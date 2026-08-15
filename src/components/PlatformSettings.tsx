import { useEffect, useState } from 'react';
import { Instagram, Youtube, CheckCircle, XCircle, Settings, ChevronDown, ChevronUp, Bot, Sparkles, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BillingSettings } from './BillingSettings';

function ConfigForm({ platform, onSaved }: { platform: string, onSaved: () => void }) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/platforms/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, client_id: clientId, client_secret: clientSecret })
      });
      if (res.ok) {
        toast.success(`App Configuration for ${platform} saved!`);
        onSaved();
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (err) {
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Settings size={16}/> Developer App Credentials</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Client ID</label>
          <input 
            type="text" 
            required 
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            className="w-full text-sm border-neutral-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" 
            placeholder="Paste your Client ID here"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Client Secret</label>
          <input 
            type="password" 
            required 
            value={clientSecret}
            onChange={e => setClientSecret(e.target.value)}
            className="w-full text-sm border-neutral-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" 
            placeholder="Paste your Client Secret here"
          />
        </div>
        <button type="submit" disabled={loading} className="px-3 py-1.5 bg-neutral-900 text-white text-sm rounded-md hover:bg-neutral-800 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save App Credentials'}
        </button>
      </div>
    </form>
  );
}

function AmazonConfigForm({ onSaved }: { onSaved: () => void }) {
  const [affiliateTag, setAffiliateTag] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/platforms/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'amazon', client_id: affiliateTag, client_secret: category })
      });
      if (res.ok) {
        toast.success(`Amazon Configuration saved!`);
        onSaved();
      } else {
        toast.error('Failed to save Amazon config');
      }
    } catch (err) {
      toast.error('Failed to save Amazon config');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-800"><Settings size={16}/> Amazon Engine Settings</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-amber-900 mb-1">Amazon Affiliate Store ID (Tag)</label>
          <input 
            type="text" 
            required 
            value={affiliateTag}
            onChange={e => setAffiliateTag(e.target.value)}
            className="w-full text-sm border-amber-300 rounded-md focus:ring-amber-500 focus:border-amber-500" 
            placeholder="e.g. mytag-20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-amber-900 mb-1">Target Category (for 1% BSR search)</label>
          <input 
            type="text" 
            required 
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full text-sm border-amber-300 rounded-md focus:ring-amber-500 focus:border-amber-500" 
            placeholder="e.g. Electronics, Home, Books"
          />
        </div>
        <p className="text-xs text-amber-700">The automation engine will automatically generate 3 drafts per day using these settings.</p>
        <button type="submit" disabled={loading} className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Amazon Engine'}
        </button>
      </div>
    </form>
  );
}

function GeminiConfigForm({ onSaved }: { onSaved: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/platforms/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'gemini', client_id: apiKey, client_secret: 'gemini-3.1-pro-low' })
      });
      if (res.ok) {
        toast.success(`Gemini Configuration saved!`);
        onSaved();
      } else {
        toast.error('Failed to save Gemini config');
      }
    } catch (err) {
      toast.error('Failed to save Gemini config');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-purple-800"><Settings size={16}/> Google AI Studio Settings</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-purple-900 mb-1">Gemini API Key</label>
          <input 
            type="password" 
            required 
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="w-full text-sm border-purple-300 rounded-md focus:ring-purple-500 focus:border-purple-500" 
            placeholder="AIzaSy..."
          />
        </div>
        <p className="text-xs text-purple-700">Bring Your Own Key (BYOK). This will enforce the low-cost <strong>gemini-3.1-pro-low</strong> model across all AI tasks.</p>
        <button type="submit" disabled={loading} className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save API Key'}
        </button>
      </div>
    </form>
  );
}

function WhatsAppConfigForm({ onSaved }: { onSaved: () => void }) {
  const [verifyToken, setVerifyToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/platforms/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'whatsapp', client_id: verifyToken, client_secret: accessToken })
      });
      if (res.ok) {
        toast.success(`WhatsApp Configuration saved!`);
        onSaved();
      } else {
        toast.error('Failed to save WhatsApp config');
      }
    } catch (err) {
      toast.error('Failed to save WhatsApp config');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-800"><Settings size={16}/> WhatsApp Cloud API Settings</h4>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-green-900 mb-1">Verify Token (For Webhook)</label>
          <input 
            type="text" 
            required 
            value={verifyToken}
            onChange={e => setVerifyToken(e.target.value)}
            className="w-full text-sm border-green-300 rounded-md focus:ring-green-500 focus:border-green-500" 
            placeholder="Custom token to verify your webhook"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-green-900 mb-1">Permanent Access Token</label>
          <input 
            type="password" 
            required 
            value={accessToken}
            onChange={e => setAccessToken(e.target.value)}
            className="w-full text-sm border-green-300 rounded-md focus:ring-green-500 focus:border-green-500" 
            placeholder="EA..."
          />
        </div>
        <p className="text-xs text-green-700">These credentials allow the Assistant to interact with you via WhatsApp.</p>
        <button type="submit" disabled={loading} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save WhatsApp Config'}
        </button>
      </div>
    </form>
  );
}

function AssistantSettingsForm() {
  const { user, updateAssistant } = useAuth();
  const [name, setName] = useState(user?.assistantName || 'Assistant');
  const [avatar, setAvatar] = useState(user?.assistantAvatar || '🤖');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateAssistant(name, avatar);
      toast.success('Assistant personalized successfully!');
    } catch (err) {
      toast.error('Failed to update assistant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm max-w-2xl mx-auto mb-8">
      <h2 className="text-2xl font-bold mb-2">Personalize Your Assistant</h2>
      <p className="text-neutral-500 mb-6">Customize the name and avatar of your virtual assistant.</p>
      
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Assistant Name</label>
          <input 
            type="text" 
            required 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-sm border-neutral-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
            placeholder="e.g. Assistant, Max, Emma"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Assistant Avatar (Emoji)</label>
          <input 
            type="text" 
            maxLength={2}
            required 
            value={avatar}
            onChange={e => setAvatar(e.target.value)}
            className="w-full text-sm border-neutral-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" 
            placeholder="🤖"
          />
        </div>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Personalization'}
        </button>
      </form>
    </div>
  );
}

export default function PlatformSettings() {
  const { user } = useAuth();
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [configuredPlatforms, setConfiguredPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/platforms/status');
      const data = await res.json();
      setConnectedPlatforms(data.connected.map((p: string) => p.toLowerCase()));
      setConfiguredPlatforms(data.configured.map((p: string) => p.toLowerCase()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = (platform: string) => {
    window.open(`/auth/${platform.toLowerCase()}`, '_blank', 'width=600,height=700');
  };

  if (loading) return <div className="p-8 text-neutral-500">Loading settings...</div>;

  const renderPlatformRow = (id: string, name: string, description: string, icon: React.ReactNode, bgClass: string, textClass: string) => {
    const isConfigured = configuredPlatforms.includes(id);
    const isConnected = connectedPlatforms.includes(id);
    const isExpanded = expandedConfig === id;

    return (
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-white">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full flex items-center justify-center font-bold text-xl h-12 w-12 ${bgClass} ${textClass}`}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{name}</h3>
              <p className="text-sm text-neutral-500">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2 text-emerald-600 font-medium px-4 py-2 bg-emerald-50 rounded-md">
                <CheckCircle size={18} /> Connected
              </div>
            ) : isConfigured ? (
              <button 
                onClick={() => handleConnect(id)}
                className="px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800"
              >
                Connect Account
              </button>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
                App Config Required
              </div>
            )}
            
            <button 
              onClick={() => setExpandedConfig(isExpanded ? null : id)}
              className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full"
              title="Configure Developer Credentials"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="px-4 pb-4 bg-white border-t border-neutral-100">
             {isConfigured ? (
               <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 text-sm flex items-center justify-between">
                 <span>Developer Credentials are configured.</span>
                 <button onClick={() => {
                   setConfiguredPlatforms(prev => prev.filter(p => p !== id));
                 }} className="text-emerald-800 underline text-xs">Edit</button>
               </div>
             ) : id === 'amazon' ? (
               <AmazonConfigForm onSaved={() => {
                 setExpandedConfig(null);
                 fetchStatus();
               }} />
             ) : id === 'gemini' ? (
               <GeminiConfigForm onSaved={() => {
                 setExpandedConfig(null);
                 fetchStatus();
               }} />
             ) : id === 'whatsapp' ? (
               <WhatsAppConfigForm onSaved={() => {
                 setExpandedConfig(null);
                 fetchStatus();
               }} />
             ) : (
               <ConfigForm platform={id} onSaved={() => {
                 setExpandedConfig(null);
                 fetchStatus();
               }} />
             )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <BillingSettings />
      <AssistantSettingsForm />
      <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Platform Connections</h2>

      <p className="text-neutral-500 mb-8">
        1. Add your Developer App Credentials (Client ID & Secret).<br/>
        2. Click Connect to authorize with your active browser session.
      </p>

      <div className="space-y-4">
        {renderPlatformRow('instagram', 'Instagram', 'Business or Creator account required.', <Instagram size={24} />, 'bg-pink-100', 'text-pink-600')}
        {renderPlatformRow('pinterest', 'Pinterest', 'Publish pins directly to your boards.', 'P', 'bg-red-100', 'text-red-600')}
        {renderPlatformRow('youtube', 'YouTube', 'Publish images to the Community tab.', <Youtube size={24} />, 'bg-red-100', 'text-red-600')}
        {renderPlatformRow('whatsapp', 'WhatsApp (Assistant)', `Connect WhatsApp API to interact with ${user?.assistantName || 'Assistant'} via chat.`, <MessageCircle size={24} />, 'bg-green-100', 'text-green-600')}
        {renderPlatformRow('amazon', 'Amazon Automation Engine', 'Configure Top 1% BSR daily fetcher.', <Bot size={24} />, 'bg-amber-100', 'text-amber-600')}
        {renderPlatformRow('gemini', 'Google AI Studio', 'Bring your own key for the AI agents.', <Sparkles size={24} />, 'bg-purple-100', 'text-purple-600')}
      </div>
      </div>
    </>
  );
}
