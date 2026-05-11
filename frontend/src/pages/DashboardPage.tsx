import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, Plus, Tags, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { applicationsApi } from '../api/applications';
import { Application, ApplicationStatus, UserRole } from '../types';
import { fmtRel, ROLE_LABEL } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { PageLoader } from '../components/common/Spinner';
import PageHeader from '../components/common/PageHeader';

export default function DashboardPage() {
  const { user } = useAuth();
  const isApplicant = user?.role === UserRole.APPLICANT;

  const { data, isLoading } = useQuery({
    queryKey: ['apps', 'recent'],
    queryFn: () => applicationsApi.list({ pageSize: 50 }),
  });

  if (isLoading) return <PageLoader />;

  const apps = data?.items ?? [];
  const counts = countByStatus(apps);
  const recent = apps.slice(0, 6);

  return (
    <div>
      <PageHeader
        title={`Welcome${user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}`}
        subtitle={user ? `Signed in as ${ROLE_LABEL[user.role]}${user.department ? ` — ${user.department.name}` : ''}` : undefined}
        actions={
          isApplicant && (
            <Link to="/applications/new" className="btn btn-primary">
              <Plus size={15} /> New application
            </Link>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Tile icon={<FileText size={18} />} label="Total" value={data?.meta.total ?? apps.length} />
        <Tile
          icon={<Clock size={18} className="text-amber-600" />}
          label="In progress"
          value={
            counts[ApplicationStatus.SUBMITTED] +
            counts[ApplicationStatus.UNDER_REVIEW] +
            counts[ApplicationStatus.ADDITIONAL_INFO_REQUIRED] +
            counts[ApplicationStatus.REVIEWED]
          }
        />
        <Tile icon={<CheckCircle2 size={18} className="text-emerald-600" />} label="Approved" value={counts[ApplicationStatus.APPROVED]} />
        <Tile icon={<XCircle size={18} className="text-red-600" />} label="Rejected" value={counts[ApplicationStatus.REJECTED]} />
      </div>

      {isApplicant && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Link to="/applications/new" className="card p-5 hover:border-bnr transition-colors">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded bg-bnr-soft text-bnr flex items-center justify-center">
                <Plus size={18} />
              </div>
              <div>
                <div className="font-medium">Start a new application</div>
                <div className="text-[12px] text-[color:var(--color-ink-soft)] mt-0.5">
                  Pick a license type and submit your documents.
                </div>
              </div>
            </div>
          </Link>
          <Link to="/catalog" className="card p-5 hover:border-bnr transition-colors">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded bg-bnr-soft text-bnr flex items-center justify-center">
                <Tags size={18} />
              </div>
              <div>
                <div className="font-medium">Browse the license catalog</div>
                <div className="text-[12px] text-[color:var(--color-ink-soft)] mt-0.5">
                  Review requirements, fees and processing times.
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {counts[ApplicationStatus.ADDITIONAL_INFO_REQUIRED] > 0 && isApplicant && (
        <div className="card p-4 border-orange-300 bg-orange-50 mb-6 flex items-start gap-3">
          <AlertCircle className="text-orange-600 shrink-0 mt-0.5" size={18} />
          <div className="text-[13px]">
            <div className="font-medium text-orange-800">
              {counts[ApplicationStatus.ADDITIONAL_INFO_REQUIRED]} application
              {counts[ApplicationStatus.ADDITIONAL_INFO_REQUIRED] === 1 ? '' : 's'} need your attention
            </div>
            <div className="text-orange-700/80">
              Reviewers have requested additional information. Resubmit when ready.
            </div>
          </div>
          <Link to="/applications" className="btn btn-ghost ml-auto shrink-0">View</Link>
        </div>
      )}

      <div className="card">
        <div className="px-5 py-3 border-b border-[color:var(--color-bnr-line)] flex items-center justify-between">
          <h2 className="font-medium text-[14px]">Recent applications</h2>
          <Link to="/applications" className="text-[12px] text-bnr hover:underline">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[color:var(--color-ink-soft)]">
            No applications yet.
          </div>
        ) : (
          <ul>
            {recent.map((a) => (
              <li key={a.id} className="border-b last:border-0 border-[color:var(--color-bnr-line)]">
                <Link to={`/applications/${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-bnr-soft/40">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-bnr">{a.reference_id}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="text-[13px] mt-0.5 truncate">{a.license_type?.name ?? 'License application'}</div>
                  </div>
                  <div className="text-[12px] text-[color:var(--color-ink-soft)] shrink-0">
                    {fmtRel(a.updated_at)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[color:var(--color-ink-soft)]">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}

function countByStatus(apps: Application[]): Record<ApplicationStatus, number> {
  const z = Object.values(ApplicationStatus).reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<ApplicationStatus, number>,
  );
  for (const a of apps) z[a.status] = (z[a.status] ?? 0) + 1;
  return z;
}
