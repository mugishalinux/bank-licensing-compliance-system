import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { applicationsApi } from '../api/applications';
import { ApplicationStatus, UserRole } from '../types';
import { STATUS_LABEL, fmtRel } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import PageHeader from '../components/common/PageHeader';
import { PageLoader } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

export default function ApplicationsPage() {
  const { user } = useAuth();
  const isApplicant = user?.role === UserRole.APPLICANT;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | ApplicationStatus>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['apps', { search, status, page }],
    queryFn: () =>
      applicationsApi.list({
        search: search || undefined,
        status: status || undefined,
        page,
        pageSize: 20,
      }),
  });

  return (
    <div>
      <PageHeader
        title={isApplicant ? 'My applications' : 'Applications queue'}
        subtitle={
          isApplicant
            ? 'Applications you have submitted to the BNR.'
            : user?.department
              ? `Applications routed to ${user.department.name}.`
              : 'All applications.'
        }
        actions={
          isApplicant && (
            <Link to="/catalog" className="btn btn-primary">
              <Plus size={15} /> New application
            </Link>
          )
        }
      />

      <div className="card p-4 mb-4 flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-ink-soft)]" />
          <input
            className="input pl-9"
            placeholder="Search by reference, applicant or institution…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="select max-w-[200px]"
          value={status}
          onChange={(e) => { setStatus(e.target.value as ApplicationStatus | ''); setPage(1); }}
        >
          <option value="">All statuses</option>
          {Object.values(ApplicationStatus).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title={isApplicant ? 'No applications yet' : 'No applications found'}
          message={
            isApplicant
              ? 'Start by browsing the license catalog.'
              : 'Try clearing the filters above.'
          }
          action={
            isApplicant && (
              <Link to="/catalog" className="btn btn-primary"><Plus size={15} /> Browse catalog</Link>
            )
          }
        />
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[color:var(--color-surface)] text-[color:var(--color-ink-soft)] text-[11px] uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5 font-medium">Reference</th>
                  <th className="text-left px-4 py-2.5 font-medium">License type</th>
                  {!isApplicant && <th className="text-left px-4 py-2.5 font-medium">Applicant</th>}
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((a) => (
                  <tr key={a.id} className="border-t border-[color:var(--color-bnr-line)] hover:bg-bnr-soft/40">
                    <td className="px-4 py-3">
                      <Link to={`/applications/${a.id}`} className="font-mono text-bnr hover:underline">
                        {a.reference_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="truncate max-w-[280px]">{a.license_type?.name ?? '—'}</div>
                      <div className="text-[11px] text-[color:var(--color-ink-soft)]">
                        {a.department?.name ?? ''}
                      </div>
                    </td>
                    {!isApplicant && (
                      <td className="px-4 py-3">
                        <div>{a.institution_name_snapshot || a.applicant_name_snapshot}</div>
                        <div className="text-[11px] text-[color:var(--color-ink-soft)]">{a.email_snapshot}</div>
                      </td>
                    )}
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-[color:var(--color-ink-soft)]">{fmtRel(a.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-[12px]">
              <div className="text-[color:var(--color-ink-soft)]">
                Page {data.meta.page} of {data.meta.totalPages} — {data.meta.total} total
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost"
                  disabled={!data.meta.hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >Previous</button>
                <button
                  className="btn btn-ghost"
                  disabled={!data.meta.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
