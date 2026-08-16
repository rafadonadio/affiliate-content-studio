import { API_URL } from '../config.js';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, MousePointerClick, Heart, MessageCircle, Sparkles } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL + '/api/analytics')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-red-500">Failed to load analytics data.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Performance Analytics</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center text-neutral-500 mb-2">
            <TrendingUp className="w-5 h-5 mr-2" />
            <h3 className="text-sm font-medium">Total Posts</h3>
          </div>
          <p className="text-3xl font-bold">{data.metrics.totalPosts}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center text-neutral-500 mb-2">
            <Heart className="w-5 h-5 mr-2" />
            <h3 className="text-sm font-medium">Total Likes</h3>
          </div>
          <p className="text-3xl font-bold">{data.metrics.totalLikes}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center text-neutral-500 mb-2">
            <MousePointerClick className="w-5 h-5 mr-2" />
            <h3 className="text-sm font-medium">Total Clicks</h3>
          </div>
          <p className="text-3xl font-bold">{data.metrics.totalClicks}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center text-neutral-500 mb-2">
            <MessageCircle className="w-5 h-5 mr-2" />
            <h3 className="text-sm font-medium">Comments</h3>
          </div>
          <p className="text-3xl font-bold">{data.metrics.totalComments}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold mb-6">Engagement Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="likes" fill="#171717" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 opacity-10 rounded-full blur-2xl"></div>
          
          <div className="flex items-center text-indigo-600 mb-4">
            <Sparkles className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">Gemini AI Insights</h3>
          </div>
          
          <div className="prose prose-sm text-indigo-900 leading-relaxed">
            {data.aiInsight}
          </div>
          
          <div className="mt-6 pt-6 border-t border-indigo-200/50">
            <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider">
              Powered by Google Gemini
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
