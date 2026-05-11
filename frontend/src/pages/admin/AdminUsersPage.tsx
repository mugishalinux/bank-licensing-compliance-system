import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Users as UsersIcon, Search } from 'lucide-react';
import { usersApi } from '../../api/users';
import { departmentsApi } from '../../api/departments';
import { ApplicantType, Department, User, UserRole } from '../../types';
import { ROLE_LABEL, errorMessage, fmtRel } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import { PageLoader } from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [creating, setCreating] = useState(false);

  const list = useQuery({
    queryKey: ['users', { search, role }],
    queryFn: () => usersApi.list({ search: search || undefined, role: role || undefined, pageSize: 100 }),
  });

  const depts = useQuery({
    queryKey: ['departments', { is_active: true }],
    queryFn: () => departmentsApi.list({ is_active: true, pageSize: 100 }),
  });

  const toggle = useMutation({
    mutationFn: async (u: User) => {
      if (u.is_active) await usersApi.deactivate(u.id);
      else await usersApi.activate(u.id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Updated'); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage staff (reviewers, approvers) and applicants."
        actions={
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={15} /> New user
          </button>
        }
      />

      <div className="card p-4 mb-4 flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-ink-soft)]" />
          <input
            className="input pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select max-w-[200px]" value={role} onChange={(e) => setRole(e.target.value as UserRole | '')}>
          <option value="">All roles</option>
          {Object.values(UserRole).map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      </div>

      {list.isLoading ? (
        <PageLoader />
      ) : (list.data?.items.length ?? 0) === 0 ? (
        <EmptyState icon={<UsersIcon size={32} />} title="No users match your filters" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[color:var(--color-surface)] text-[color:var(--color-ink-soft)] text-[11px] uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Email</th>
                <th className="text-left px-4 py-2.5 font-medium">Role</th>
                <th className="text-left px-4 py-2.5 font-medium">Department / Type</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Created</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {list.data?.items.map((u) => (
                <tr key={u.id} className="border-t border-[color:var(--color-bnr-line)] hover:bg-bnr-soft/40">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.full_name}</div>
                    {u.institution_name && (
                      <div className="text-[11px] text-[color:var(--color-ink-soft)]">{u.institution_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3"><span className="tag bg-bnr-soft text-bnr">{ROLE_LABEL[u.role]}</span></td>
                  <td className="px-4 py-3 text-[color:var(--color-ink-soft)]">
                    {u.department?.name ?? u.applicant_type ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`tag ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[color:var(--color-ink-soft)]">{fmtRel(u.created_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      className={`btn ${u.is_active ? 'btn-danger' : 'btn-ghost'}`}
                      onClick={() => toggle.mutate(u)}
                      disabled={toggle.isPending}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <UserForm departments={depts.data?.items ?? []} onClose={() => setCreating(false)} />
      )}
    </div>
  );
}

function UserForm({ departments, onClose }: { departments: Department[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.REVIEWER);
  const [departmentId, setDepartmentId] = useState('');
  const [applicantType, setApplicantType] = useState<ApplicantType>(ApplicantType.INDIVIDUAL);
  const [institutionName, setInstitutionName] = useState('');

  const isStaff = role === UserRole.REVIEWER || role === UserRole.APPROVER;
  const isApplicant = role === UserRole.APPLICANT;

  const save = useMutation({
    mutationFn: () =>
      usersApi.create({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        role,
        department_id: isStaff ? departmentId : undefined,
        applicant_type: isApplicant ? applicantType : undefined,
        institution_name:
          isApplicant && applicantType === ApplicantType.ORGANIZATION ? institutionName.trim() : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const disabled =
    save.isPending ||
    !email.trim() ||
    password.length < 8 ||
    !fullName.trim() ||
    (isStaff && !departmentId) ||
    (isApplicant && applicantType === ApplicantType.ORGANIZATION && !institutionName.trim());

  return (
    <Modal
      open
      onClose={onClose}
      title="New user"
      size="lg"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={save.isPending}>Cancel</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={disabled}>
            {save.isPending ? 'Creating…' : 'Create user'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Role</label>
          <select className="select" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </div>
        {isStaff && (
          <div>
            <label className="label">Department</label>
            <select className="select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">Select…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
        {isApplicant && (
          <div>
            <label className="label">Applicant type</label>
            <select className="select" value={applicantType} onChange={(e) => setApplicantType(e.target.value as ApplicantType)}>
              <option value={ApplicantType.INDIVIDUAL}>Individual</option>
              <option value={ApplicantType.ORGANIZATION}>Organization</option>
            </select>
          </div>
        )}

        <div className="col-span-2">
          <label className="label">Full name</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        {isApplicant && applicantType === ApplicantType.ORGANIZATION && (
          <div className="col-span-2">
            <label className="label">Institution name</label>
            <input className="input" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 …" />
        </div>
        <div className="col-span-2">
          <label className="label">Initial password</label>
          <input type="text" className="input font-mono" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          <p className="text-[11px] text-[color:var(--color-ink-soft)] mt-1">
            Share this securely with the user. They can change it via Forgot password.
          </p>
        </div>
      </div>
    </Modal>
  );
}
