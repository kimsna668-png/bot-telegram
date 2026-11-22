import React, { useState, useEffect } from 'react';
import { Activity, Search, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api.js';

export const AuditLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/audit-logs');
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Security Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable audit trail of administrative modifications, inventory uploads and settings updates.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-800/50 text-purple-200 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-[#140826] border border-purple-800/40 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-purple-900/50 bg-purple-950/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Admin Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/30">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-purple-900/20 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {log.adminEmail || `TG:${log.telegramId}` || 'System'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-400 text-[11px]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">{log.entity}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
