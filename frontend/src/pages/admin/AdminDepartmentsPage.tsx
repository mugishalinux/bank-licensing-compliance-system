import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, ShieldCheck } from 'lucide-react';
import { departmentsApi } from '../../api/departments';
import { Department } from '../../types';
import { errorMessage, fmtDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import { PageLoader } from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

export default function AdminDepartmentsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Department | 'new' | null>(null);

  const list = useQuery({
    queryKey: ['departments', 'admin'],
    queryFn: () => departmentsApi.list({ pageSize: 100 }),
  });

  const toggle = useMutation({
    mutationFn: async (d: Department) => {
      if (d.is_active) await departmentsApi.deactivate(d.id);
      else await departmentsApi.update(d.id, { is_active: true });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Updated'); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Departments group license types and scope reviewer/approver access."
        actions={
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={15} /> New department
          </button>
        }
      />

      {list.isLoading ? (
        <PageLoader />
      ) : (list.data?.items.length ?? 0) === 0 ? (
        <EmptyState icon={<ShieldCheck size={32} />} title="No departments yet" message="Create your first department to organize license types." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[color:var(--color-surface)] text-[color:var(--color-ink-soft)] text-[11px] uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium">Code</th>
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Description</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Updated</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {list.data?.items.map((d) => (
                <tr key={d.id} className="border-t border-[color:var(--color-bnr-line)] hover:bg-bnr-soft/40">
                  <td className="px-4 py-3 font-mono">{d.code}</td>
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-[color:var(--color-ink-soft)] max-w-[320px] truncate">{d.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`tag ${d.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {d.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-ink-soft)]">{fmtDate(d.updated_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button className="btn btn-ghost" onClick={() => setEditing(d)}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      className={`btn ${d.is_active ? 'btn-danger' : 'btn-ghost'} ml-2`}
                      onClick={() => toggle.mutate(d)}
                      disabled={toggle.isPending}
                    >
                      {d.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <DeptForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function DeptForm({ initial, onClose }: { initial: Department | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  const save = useMutation({
    mutationFn: () =>
      initial
        ? departmentsApi.update(initial.id, { name, code, description })
        : departmentsApi.create({ name, code, description: description || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success(initial ? 'Department updated' : 'Department created');
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'Edit department' : 'New department'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={save.isPending}>Cancel</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !name.trim() || !code.trim()}>
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">Code</label>
          <input className="input font-mono" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BANK" maxLength={50} />
        </div>
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Banking Supervision" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="textarea" rows={3} value={description ?? ''} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
