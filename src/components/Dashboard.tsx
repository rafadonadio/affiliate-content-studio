import { useState } from 'react';
import { FileText, RefreshCw, BarChart } from 'lucide-react';
import ExecutionLogs from './ExecutionLogs';

export default function Dashboard() {
  const [link, setLink] = useState('');
  const [caption, setCaption] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [image, setImage] = useState('');
  const [loadingCaption, setLoadingCaption] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  const generateCaption = async () => {
    setLoadingCaption(true);
    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productLink: link }),
      });
      const data = await response.json();
      setCaption(data.caption);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCaption(false);
    }
  };

  const generateImage = async () => {
    setLoadingImage(true);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            disabled={loadingCaption}
            className="w-full bg-neutral-900 text-white py-2 rounded-md hover:bg-neutral-800 disabled:opacity-50 mb-8"
          >
            {loadingCaption ? 'Generating...' : 'Generate Caption'}
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
            disabled={loadingImage}
            className="w-full bg-neutral-900 text-white py-2 rounded-md hover:bg-neutral-800 disabled:opacity-50"
          >
            {loadingImage ? 'Generating...' : 'Generate Image'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Generated Content</h2>
          <div className="mb-6">
            <h3 className="font-medium text-sm mb-2 text-neutral-500">Caption</h3>
            <div className="p-4 bg-neutral-100 rounded-md whitespace-pre-wrap min-h-24">
              {caption || 'Caption will appear here...'}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm mb-2 text-neutral-500">Visual</h3>
            {image ? (
                <img src={image} alt="Generated" referrerPolicy="no-referrer" className="w-full rounded-md" />
            ) : (
                <div className="p-4 bg-neutral-100 rounded-md min-h-48 flex items-center justify-center text-neutral-500">Image will appear here...</div>
            )}
          </div>
        </div>
      </div>

      <ExecutionLogs />
    </>
  );
}
