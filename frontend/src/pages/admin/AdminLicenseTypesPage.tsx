import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Tags, ListChecks, Trash2 } from 'lucide-react';
import { licenseTypesApi } from '../../api/licenseTypes';
import { departmentsApi } from '../../api/departments';
import { Department, LicenseRequirement, LicenseType } from '../../types';
import { errorMessage, fmtMoney } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import { PageLoader } from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Confirm from '../../components/common/Confirm';

export default function AdminLicenseTypesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<LicenseType | 'new' | null>(null);
  const [reqsFor, setReqsFor] = useState<LicenseType | null>(null);

  const types = useQuery({
    queryKey: ['license-types', 'admin'],
    queryFn: () => licenseTypesApi.list({ pageSize: 100 }),
  });
  const depts = useQuery({
    queryKey: ['departments', { is_active: true }],
    queryFn: () => departmentsApi.list({ is_active: true, pageSize: 100 }),
  });

  const toggle = useMutation({
    mutationFn: async (lt: LicenseType) => {
      if (lt.is_active) await licenseTypesApi.deactivate(lt.id);
      else await licenseTypesApi.update(lt.id, { is_active: true });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['license-types'] }); toast.success('Updated'); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <PageHeader
        title="License types"
        subtitle="The licenses applicants can apply for. Each license belongs to a department and may have requirements."
        actions={
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={15} /> New license type
          </button>
        }
      />

      {types.isLoading ? (
        <PageLoader />
      ) : (types.data?.items.length ?? 0) === 0 ? (
        <EmptyState icon={<Tags size={32} />} title="No license types yet" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[color:var(--color-surface)] text-[color:var(--color-ink-soft)] text-[11px] uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Department</th>
                <th className="text-left px-4 py-2.5 font-medium">Processing</th>
                <th className="text-left px-4 py-2.5 font-medium">Fee</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {types.data?.items.map((lt) => (
                <tr key={lt.id} className="border-t border-[color:var(--color-bnr-line)] hover:bg-bnr-soft/40">
                  <td className="px-4 py-3">
                    <div className="font-medium">{lt.name}</div>
                    {lt.description && (
                      <div className="text-[11px] text-[color:var(--color-ink-soft)] truncate max-w-[320px]">{lt.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{lt.department?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-[color:var(--color-ink-soft)]">{lt.processing_time_days} days</td>
                  <td className="px-4 py-3">{fmtMoney(lt.is_paid ? lt.fee_amount : null)}</td>
                  <td className="px-4 py-3">
                    <span className={`tag ${lt.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {lt.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button className="btn btn-ghost" onClick={() => setReqsFor(lt)}>
                      <ListChecks size={13} /> Requirements
                    </button>
                    <button className="btn btn-ghost ml-2" onClick={() => setEditing(lt)}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      className={`btn ${lt.is_active ? 'btn-danger' : 'btn-ghost'} ml-2`}
                      onClick={() => toggle.mutate(lt)}
                      disabled={toggle.isPending}
                    >
                      {lt.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <TypeForm
          initial={editing === 'new' ? null : editing}
          departments={depts.data?.items ?? []}
          onClose={() => setEditing(null)}
        />
      )}
      {reqsFor && (
        <RequirementsModal type={reqsFor} onClose={() => setReqsFor(null)} />
      )}
    </div>
  );
}

function TypeForm({
  initial,
  departments,
  onClose,
}: {
  initial: LicenseType | null;
  departments: Department[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [departmentId, setDepartmentId] = useState(initial?.department_id ?? departments[0]?.id ?? '');
  const [processingDays, setProcessingDays] = useState(initial?.processing_time_days ?? 30);
  const [isPaid, setIsPaid] = useState(initial?.is_paid ?? false);
  const [feeAmount, setFeeAmount] = useState(initial?.fee_amount ?? '');

  const save = useMutation({
    mutationFn: () => {
      const base = {
        name,
        description: description || undefined,
        department_id: departmentId,
        processing_time_days: Number(processingDays),
        is_paid: isPaid,
        fee_amount: isPaid ? String(feeAmount) : undefined,
      };
      return initial
        ? licenseTypesApi.update(initial.id, base)
        : licenseTypesApi.create(base);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['license-types'] });
      toast.success(initial ? 'Updated' : 'Created');
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const disabled =
    save.isPending ||
    !name.trim() ||
    !departmentId ||
    !processingDays ||
    (isPaid && !String(feeAmount).trim());

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'Edit license type' : 'New license type'}
      size="lg"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={save.isPending}>Cancel</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={disabled}>
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Commercial Banking License" />
        </div>
        <div>
          <label className="label">Department</label>
          <select className="select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">Select…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Processing time (days)</label>
          <input
            type="number"
            min={1}
            max={3650}
            className="input"
            value={processingDays}
            onChange={(e) => setProcessingDays(Number(e.target.value))}
          />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="textarea" rows={3} value={description ?? ''} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
            This license requires a fee
          </label>
        </div>
        {isPaid && (
          <div>
            <label className="label">Fee amount (RWF)</label>
            <input className="input" inputMode="decimal" value={feeAmount ?? ''} onChange={(e) => setFeeAmount(e.target.value)} placeholder="500000" />
          </div>
        )}
      </div>
    </Modal>
  );
}

function RequirementsModal({ type, onClose }: { type: LicenseType; onClose: () => void }) {
  const qc = useQueryClient();
  const [removing, setRemoving] = useState<LicenseRequirement | null>(null);
  const [editing, setEditing] = useState<LicenseRequirement | 'new' | null>(null);

  const reqs = useQuery({
    queryKey: ['requirements', type.id],
    queryFn: () => licenseTypesApi.listRequirements(type.id),
  });

  const remove = useMutation({
    mutationFn: (r: LicenseRequirement) => licenseTypesApi.removeRequirement(r.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requirements', type.id] });
      qc.invalidateQueries({ queryKey: ['license-types'] });
      toast.success('Requirement removed');
      setRemoving(null);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`Requirements — ${type.name}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              <Plus size={14} /> Add requirement
            </button>
          </>
        }
      >
        {reqs.isLoading ? (
          <PageLoader />
        ) : (reqs.data?.length ?? 0) === 0 ? (
          <p className="text-[13px] text-[color:var(--color-ink-soft)] text-center py-6">
            No requirements yet. Add the documents and checks applicants must satisfy.
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--color-bnr-line)]">
            {reqs.data?.map((r) => (
              <li key={r.id} className="py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[13px]">{r.name}</span>
                    {r.is_mandatory && <span className="tag bg-red-50 text-red-700">Required</span>}
                    {r.requires_attachment && <span className="tag bg-blue-50 text-blue-700">Attachment</span>}
                  </div>
                  {r.description && (
                    <p className="text-[12px] text-[color:var(--color-ink-soft)] mt-1">{r.description}</p>
                  )}
                </div>
                <button className="btn btn-ghost shrink-0" onClick={() => setEditing(r)}>
                  <Pencil size={13} />
                </button>
                <button className="btn btn-danger shrink-0" onClick={() => setRemoving(r)}>
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {editing && (
        <RequirementForm
          typeId={type.id}
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <Confirm
          open
          onClose={() => setRemoving(null)}
          onConfirm={() => remove.mutate(removing)}
          title="Remove requirement"
          message={`Remove "${removing.name}"? This affects future applications only.`}
          confirmLabel="Remove"
          destructive
          busy={remove.isPending}
        />
      )}
    </>
  );
}

function RequirementForm({
  typeId,
  initial,
  onClose,
}: {
  typeId: string;
  initial: LicenseRequirement | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [mandatory, setMandatory] = useState(initial?.is_mandatory ?? true);
  const [attachment, setAttachment] = useState(initial?.requires_attachment ?? false);

  const save = useMutation({
    mutationFn: () =>
      initial
        ? licenseTypesApi.updateRequirement(initial.id, {
            name,
            description: description ?? undefined,
            is_mandatory: mandatory,
            requires_attachment: attachment,
          })
        : licenseTypesApi.addRequirement(typeId, {
            name,
            description: description || undefined,
            is_mandatory: mandatory,
            requires_attachment: attachment,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requirements', typeId] });
      qc.invalidateQueries({ queryKey: ['license-types'] });
      toast.success(initial ? 'Updated' : 'Added');
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'Edit requirement' : 'New requirement'}
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
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Certificate of incorporation" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="textarea" rows={3} value={description ?? ''} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} />
            Mandatory
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={attachment} onChange={(e) => setAttachment(e.target.checked)} />
            Requires a file attachment
          </label>
        </div>
      </div>
    </Modal>
  );
}
