import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/audit';
import { formatDate } from '../utils/formatters';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ACTION_COLORS: Record<string, string> = {
  APPLICATION_CREATED: 'bg-gray-100 text-gray-600',
  APPLICATION_SUBMITTED: 'bg-blue-100 text-blue-700',
  REVIEW_STARTED: 'bg-yellow-100 text-yellow-700',
  ADDITIONAL_INFO_REQUESTED: 'bg-orange-100 text-orange-700',
  REVIEW_COMPLETED: 'bg-purple-100 text-purple-700',
  APPLICATION_APPROVED: 'bg-green-100 text-green-700',
  APPLICATION_REJECTED: 'bg-red-100 text-red-700',
  DOCUMENT_UPLOADED: 'bg-cyan-100 text-cyan-700',
};

export default function AuditPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => auditApi.list(1, 100),
  });

  const logs = data?.data || [];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">
          Permanent, append-only record of all system actions. {data?.total ? `${data.total} total entries.` : ''}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No audit entries yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">State Change</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs">{formatDate(log.timestamp)}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{log.actor?.full_name || log.actor_id}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {log.previous_state || log.new_state
                      ? `${log.previous_state || '—'} → ${log.new_state || '—'}`
                      : '—'}
                  </td>
                  <td className="px-6 py-3">
                    {log.application_id ? (
                      <button
                        onClick={() => navigate(`/applications/${log.application_id}`)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        View <ChevronRight size={12} />
                      </button>
                    ) : '—'}
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
