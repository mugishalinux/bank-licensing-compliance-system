import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationsApi } from '../api/applications';
import { ApplicationStatus, UserRole } from '../types';
import StatusBadge from '../components/common/StatusBadge';
import { formatRelative } from '../utils/formatters';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: applicationsApi.list,
  });

  const stats = {
    total: applications.length,
    pending: applications.filter((a) =>
      [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW].includes(a.status),
    ).length,
    approved: applications.filter((a) => a.status === ApplicationStatus.APPROVED).length,
    rejected: applications.filter((a) => a.status === ApplicationStatus.REJECTED).length,
    needsInfo: applications.filter(
      (a) => a.status === ApplicationStatus.ADDITIONAL_INFO_REQUIRED,
    ).length,
  };

  const recent = [...applications]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.full_name}</h1>
        <p className="text-gray-500 mt-1">
          {hasRole(UserRole.APPLICANT)
            ? 'Manage your bank licensing applications.'
            : 'Overview of the licensing portal.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<FileText className="text-blue-600" />} label="Total Applications" value={stats.total} color="blue" />
        <StatCard icon={<Clock className="text-yellow-600" />} label="In Progress" value={stats.pending} color="yellow" />
        <StatCard icon={<CheckCircle className="text-green-600" />} label="Approved" value={stats.approved} color="green" />
        <StatCard icon={<XCircle className="text-red-600" />} label="Rejected" value={stats.rejected} color="red" />
      </div>

      {stats.needsInfo > 0 && hasRole(UserRole.APPLICANT) && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-orange-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-medium text-orange-800">
              {stats.needsInfo} application{stats.needsInfo > 1 ? 's' : ''} require additional information.
            </p>
            <button
              onClick={() => navigate('/applications')}
              className="text-sm text-orange-700 underline mt-0.5"
            >
              View applications →
            </button>
          </div>
        </div>
      )}

      {/* Recent Applications */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Applications</h2>
          <button
            onClick={() => navigate('/applications')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-500 text-sm">No applications yet.</p>
            {hasRole(UserRole.APPLICANT) && (
              <button
                onClick={() => navigate('/applications/new')}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Submit your first application →
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((app) => (
              <div
                key={app.id}
                onClick={() => navigate(`/applications/${app.id}`)}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{app.institution_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatRelative(app.updated_at)}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'yellow' | 'green' | 'red';
}) {
  const bg = { blue: 'bg-blue-50', yellow: 'bg-yellow-50', green: 'bg-green-50', red: 'bg-red-50' }[color];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
