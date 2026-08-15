import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FileText, RefreshCw, BarChart, Edit3, CalendarPlus, Check, X } from 'lucide-react';
import ExecutionLogs from './ExecutionLogs';
import ImageEditor from './ImageEditor';

export default function Dashboard() {
  const [drafts, setDrafts] = useState<any[]>([]);
  
  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/drafts');
      const data = await res.json();
      setDrafts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveDraft = async (id: number) => {
    try {
      const res = await fetch(`/api/drafts/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        toast.success("Draft approved and scheduled!");
        fetchDrafts();
      }
    } catch (e) {
      toast.error("Failed to approve draft");
    }
  };

  const handleDeleteDraft = async (id: number) => {
    try {
      const res = await fetch(`/api/scheduled/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Draft discarded.");
        fetchDrafts();
      }
    } catch (e) {
      toast.error("Failed to discard draft");
    }
  };
  const [link, setLink] = useState('');
  const [captions, setCaptions] = useState<string[]>([]);
  const [selectedCaption, setSelectedCaption] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [image, setImage] = useState('');
  const [loadingCaption, setLoadingCaption] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  
  const [showEditor, setShowEditor] = useState(false);
  const [platform, setPlatform] = useState('Instagram');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const generateCaption = async () => {
    setLoadingCaption(true);
    setCaptions([]);
    setSelectedCaption('');
    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productLink: link }),
      });
      const data = await response.json();
      if (data.captions && data.captions.length > 0) {
        setCaptions(data.captions);
        setSelectedCaption(data.captions[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCaption(false);
    }
  };

  const generateImage = async () => {
    setLoadingImage(true);
    setImage('');
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      const data = await response.json();
      setImage(data.image);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingImage(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedCaption || !image || !scheduledFor || !link) {
      alert("Please ensure you have a link, caption, image, and schedule time.");
      return;
    }
    
    setIsScheduling(true);
    try {
      const res = await fetch('/api/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productLink: link,
          caption: selectedCaption,
          imageUrl: image,
          platform,
          scheduledFor
        })
      });
      if (res.ok) {
        alert("Post scheduled successfully!");
        // Reset states
        setCaptions([]);
        setSelectedCaption('');
        setImage('');
        setLink('');
        setImagePrompt('');
        setScheduledFor('');
      } else {
        alert("Failed to schedule post");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-neutral-500"><FileText size={20}/> Active Queue</div>
          <div className="text-3xl font-bold">12</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-neutral-500"><BarChart size={20}/> Total Published</div>
          <div className="text-3xl font-bold">45</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-neutral-500"><RefreshCw size={20}/> Status</div>
          <div className="text-xl font-medium text-emerald-600">Running</div>
        </div>
      </div>

      {drafts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-sm">{drafts.length}</span> 
            Pending Approvals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {drafts.map(draft => (
              <div key={draft.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <img src={draft.image_url} alt="Draft Visual" className="w-full h-48 object-cover" />
                <div className="p-4 flex-grow flex flex-col">
                  <div className="text-xs text-neutral-500 mb-2 flex justify-between">
                    <span>{draft.platform.toUpperCase()}</span>
                    <span>{new Date(draft.scheduled_for).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm mb-4 line-clamp-3 flex-grow">{draft.caption}</p>
                  <a href={draft.product_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mb-4 truncate">
                    {draft.product_link}
                  </a>
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => handleApproveDraft(draft.id)}
                      className="flex-1 bg-emerald-600 text-white py-1.5 rounded-md hover:bg-emerald-700 flex items-center justify-center gap-1 text-sm font-medium"
                    >
                      <Check size={16}/> Approve
                    </button>
                    <button 
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="px-3 bg-neutral-100 text-neutral-600 rounded-md hover:bg-neutral-200 flex items-center justify-center"
                    >
                      <X size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Generate Content</h2>
          <input 
            type="text" 
            value={link} 
            onChange={(e) => setLink(e.target.value)}
            placeholder="Amazon Product Link" 
            className="w-full p-2 mb-4 border border-neutral-300 rounded-md" 
          />
          <button 
            onClick={generateCaption} 
            disabled={loadingCaption || !link}
            className="w-full bg-neutral-900 text-white py-2 rounded-md hover:bg-neutral-800 disabled:opacity-50 mb-8"
          >
            {loadingCaption ? 'Generating Caption...' : 'Generate Caption'}
          </button>

          <h2 className="text-lg font-semibold mb-4">Generate Visual</h2>
          <input 
            type="text" 
            value={imagePrompt} 
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Image Prompt (e.g., A sleek smartwatch on a wooden table)" 
            className="w-full p-2 mb-4 border border-neutral-300 rounded-md" 
          />
          <button 
            onClick={generateImage} 
            disabled={loadingImage || !imagePrompt}
            className="w-full bg-neutral-900 text-white py-2 rounded-md hover:bg-neutral-800 disabled:opacity-50"
          >
            {loadingImage ? 'Generating...' : 'Generate Image'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Manual Review & Schedule</h2>
          
          <div className="mb-6 flex-grow">
            <h3 className="font-medium text-sm mb-2 text-neutral-500">Caption (SEO & AIO Optimized)</h3>
            {captions.length > 0 ? (
              <div 
                className="p-3 rounded-md border border-emerald-500 bg-emerald-50"
              >
                <p className="text-sm">{selectedCaption}</p>
              </div>
            ) : (
              <div className="p-4 bg-neutral-50 rounded-md text-neutral-400 text-sm">Caption will appear here...</div>
            )}
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-sm text-neutral-500">Visual</h3>
              {image && (
                <button 
                  onClick={() => setShowEditor(true)}
                  className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <Edit3 size={14} /> Edit Image
                </button>
              )}
            </div>
            {image ? (
                <img src={image} alt="Generated" referrerPolicy="no-referrer" className="w-full rounded-md object-cover max-h-64" />
            ) : (
                <div className="p-4 bg-neutral-50 rounded-md min-h-48 flex items-center justify-center text-neutral-400 text-sm">Image will appear here...</div>
            )}
          </div>

          <div className="border-t border-neutral-200 pt-6 mt-auto">
            <h3 className="font-medium text-sm mb-3 text-neutral-500">Schedule Details</h3>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-xs text-neutral-500 mb-1">Platform</label>
                <select 
                  value={platform} 
                  onChange={e => setPlatform(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-md text-sm"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Pinterest">Pinterest</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-neutral-500 mb-1">Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={scheduledFor}
                  onChange={e => setScheduledFor(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-md text-sm"
                />
              </div>
            </div>
            <button 
              onClick={handleSchedule}
              disabled={isScheduling || !selectedCaption || !image || !scheduledFor || !link}
              className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CalendarPlus size={18} />
              {isScheduling ? 'Scheduling...' : 'Approve & Schedule Post'}
            </button>
          </div>
        </div>
      </div>

      <ExecutionLogs />

      {showEditor && image && (
        <ImageEditor 
          imageSrc={image} 
          onSave={(editedBase64) => setImage(editedBase64)} 
          onCancel={() => setShowEditor(false)} 
        />
      )}
    </>
  );
}
