import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ScrollText } from 'lucide-react';
import { auditApi } from '../api/audit';
import { fmtDate } from '../utils/formatters';
import PageHeader from '../components/common/PageHeader';
import { PageLoader } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

const ACTION_TONE: Record<string, string> = {
  APPLICATION_CREATED: 'bg-gray-100 text-gray-700',
  APPLICATION_SUBMITTED: 'bg-blue-50 text-blue-700',
  APPLICATION_RESUBMITTED: 'bg-blue-50 text-blue-700',
  REVIEW_STARTED: 'bg-amber-50 text-amber-700',
  ADDITIONAL_INFO_REQUESTED: 'bg-orange-50 text-orange-700',
  REVIEW_COMPLETED: 'bg-purple-50 text-purple-700',
  APPLICATION_APPROVED: 'bg-emerald-50 text-emerald-700',
  APPLICATION_REJECTED: 'bg-red-50 text-red-700',
  DOCUMENT_UPLOADED: 'bg-gray-100 text-gray-700',
};

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const limit = 50;

  const q = useQuery({
    queryKey: ['audit', page],
    queryFn: () => auditApi.list({ page, limit }),
  });

  const totalPages = Math.max(1, Math.ceil((q.data?.total ?? 0) / limit));

  return (
    <div>
      <PageHeader title="Audit log" subtitle="Append-only history of every state change on every application." />

      {q.isLoading ? (
        <PageLoader />
      ) : (q.data?.data.length ?? 0) === 0 ? (
        <EmptyState icon={<ScrollText size={32} />} title="No activity yet" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[color:var(--color-surface)] text-[color:var(--color-ink-soft)] text-[11px] uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5 font-medium">When</th>
                  <th className="text-left px-4 py-2.5 font-medium">Actor</th>
                  <th className="text-left px-4 py-2.5 font-medium">Action</th>
                  <th className="text-left px-4 py-2.5 font-medium">Transition</th>
                  <th className="text-left px-4 py-2.5 font-medium">Application</th>
                </tr>
              </thead>
              <tbody>
                {q.data?.data.map((e) => (
                  <tr key={e.id} className="border-t border-[color:var(--color-bnr-line)] hover:bg-bnr-soft/40">
                    <td className="px-4 py-3 text-[color:var(--color-ink-soft)] whitespace-nowrap">{fmtDate(e.timestamp)}</td>
                    <td className="px-4 py-3">{e.actor?.full_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`tag ${ACTION_TONE[e.action] ?? 'bg-gray-100 text-gray-700'}`}>
                        {e.action.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[color:var(--color-ink-soft)]">
                      {e.previous_state && e.new_state
                        ? `${e.previous_state} → ${e.new_state}`
                        : e.new_state ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {e.application_id ? (
                        <Link to={`/applications/${e.application_id}`} className="font-mono text-bnr hover:underline text-[12px]">
                          {e.application_id.slice(0, 8)}…
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-[12px]">
              <div className="text-[color:var(--color-ink-soft)]">
                Page {page} of {totalPages} — {q.data?.total ?? 0} total
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
                <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
