import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, FileCheck2, Clock, Banknote } from 'lucide-react';
import { licenseTypesApi } from '../api/licenseTypes';
import { departmentsApi } from '../api/departments';
import { applicationsApi } from '../api/applications';
import { LicenseType } from '../types';
import { errorMessage, fmtMoney } from '../utils/formatters';
import PageHeader from '../components/common/PageHeader';
import { PageLoader } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

export default function CatalogPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');

  const types = useQuery({
    queryKey: ['license-types', { search, dept, is_active: true }],
    queryFn: () => licenseTypesApi.list({ search: search || undefined, department_id: dept || undefined, is_active: true, pageSize: 100 }),
  });

  const depts = useQuery({
    queryKey: ['departments', { is_active: true }],
    queryFn: () => departmentsApi.list({ is_active: true, pageSize: 100 }),
  });

  const apply = useMutation({
    mutationFn: (id: string) => applicationsApi.create(id),
    onSuccess: (app) => {
      qc.invalidateQueries({ queryKey: ['apps'] });
      toast.success(`Draft created — ${app.reference_id}`);
      nav(`/applications/${app.id}`);
    },
    onError: (e) => toast.error(errorMessage(e, 'Could not start application')),
  });

  const byDept = useMemo(() => {
    const groups = new Map<string, { name: string; items: LicenseType[] }>();
    for (const lt of types.data?.items ?? []) {
      const d = lt.department;
      const k = d?.id ?? lt.department_id;
      if (!groups.has(k)) groups.set(k, { name: d?.name ?? 'Department', items: [] });
      groups.get(k)!.items.push(lt);
    }
    return [...groups.values()];
  }, [types.data]);

  return (
    <div>
      <PageHeader title="License catalog" subtitle="Browse the licenses you can apply for" />

      <div className="card p-4 mb-5 flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-ink-soft)]" />
          <input
            className="input pl-9"
            placeholder="Search licenses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select max-w-[220px]" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">All departments</option>
          {(depts.data?.items ?? []).map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {types.isLoading ? (
        <PageLoader />
      ) : byDept.length === 0 ? (
        <EmptyState
          icon={<FileCheck2 size={32} />}
          title="No licenses match your filters"
          message="Try a different search or clear filters."
        />
      ) : (
        <div className="space-y-6">
          {byDept.map((g) => (
            <div key={g.name}>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[color:var(--color-ink-soft)] mb-2">
                {g.name}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.items.map((lt) => (
                  <div key={lt.id} className="card p-4 flex flex-col">
                    <div className="font-medium">{lt.name}</div>
                    {lt.description && (
                      <p className="text-[12px] text-[color:var(--color-ink-soft)] mt-1 line-clamp-3">{lt.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-[12px] text-[color:var(--color-ink-soft)]">
                      <span className="inline-flex items-center gap-1"><Clock size={13} /> {lt.processing_time_days} days</span>
                      <span className="inline-flex items-center gap-1"><Banknote size={13} /> {fmtMoney(lt.is_paid ? lt.fee_amount : null)}</span>
                    </div>
                    <button
                      onClick={() => apply.mutate(lt.id)}
                      disabled={apply.isPending}
                      className="btn btn-primary mt-4"
                    >
                      Start application
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
