import { API_URL } from '../config.js';
import { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle } from 'lucide-react';

interface Log {
  id: number;
  action: string;
  details: string;
  status: string;
  created_at: string;
}

export default function ExecutionLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('saas_token');
        const res = await fetch(API_URL + '/api/logs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          console.error("Expected array of logs, got:", data);
          setLogs([]);
        }
      } catch (err) {
        console.error("Failed to fetch logs", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Database size={24} className="text-neutral-500" />
        <h2 className="text-lg font-semibold">Execution History</h2>
      </div>
      
      {loading ? (
        <p className="text-neutral-500 italic">Loading logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-neutral-500 italic">No activity logged yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-500">
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Action</th>
                <th className="pb-3 font-medium">Details</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 text-neutral-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 font-medium">{log.action}</td>
                  <td className="py-3 text-neutral-600 truncate max-w-xs">{log.details}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      log.status === 'Success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {log.status === 'Success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
