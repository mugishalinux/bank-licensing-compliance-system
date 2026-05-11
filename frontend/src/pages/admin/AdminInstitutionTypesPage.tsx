import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Building2 } from 'lucide-react';
import { institutionTypesApi } from '../../api/institutionTypes';
import { InstitutionType } from '../../types';
import { errorMessage, fmtDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import { PageLoader } from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

export default function AdminInstitutionTypesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<InstitutionType | 'new' | null>(null);

  const list = useQuery({
    queryKey: ['institution-types', 'admin'],
    queryFn: () => institutionTypesApi.list({ pageSize: 100 }),
  });

  const toggle = useMutation({
    mutationFn: async (t: InstitutionType) => {
      if (t.is_active) await institutionTypesApi.deactivate(t.id);
      else await institutionTypesApi.update(t.id, { is_active: true });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['institution-types'] }); toast.success('Updated'); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <PageHeader
        title="Institution types"
        subtitle="Categories used by organizations during registration (banks, MFIs, insurance companies…)."
        actions={
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={15} /> New type
          </button>
        }
      />

      {list.isLoading ? (
        <PageLoader />
      ) : (list.data?.items.length ?? 0) === 0 ? (
        <EmptyState icon={<Building2 size={32} />} title="No institution types yet" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[color:var(--color-surface)] text-[color:var(--color-ink-soft)] text-[11px] uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Description</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Updated</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {list.data?.items.map((t) => (
                <tr key={t.id} className="border-t border-[color:var(--color-bnr-line)] hover:bg-bnr-soft/40">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-[color:var(--color-ink-soft)] max-w-[360px] truncate">{t.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`tag ${t.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-ink-soft)]">{fmtDate(t.updated_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button className="btn btn-ghost" onClick={() => setEditing(t)}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      className={`btn ${t.is_active ? 'btn-danger' : 'btn-ghost'} ml-2`}
                      onClick={() => toggle.mutate(t)}
                      disabled={toggle.isPending}
                    >
                      {t.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <TypeForm initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function TypeForm({ initial, onClose }: { initial: InstitutionType | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  const save = useMutation({
    mutationFn: () =>
      initial
        ? institutionTypesApi.update(initial.id, { name, description })
        : institutionTypesApi.create({ name, description: description || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institution-types'] });
      toast.success(initial ? 'Updated' : 'Created');
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'Edit institution type' : 'New institution type'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={save.isPending}>Cancel</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !name.trim()}>
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Commercial Bank" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="textarea" rows={3} value={description ?? ''} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
