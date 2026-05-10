import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../api/applications';
import { documentsApi } from '../api/documents';
import { auditApi } from '../api/audit';
import { useAuth } from '../context/AuthContext';
import { ApplicationStatus, UserRole } from '../types';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate, formatFileSize } from '../utils/formatters';
import {
  ArrowLeft, Upload, Download, FileText, Clock, AlertCircle,
  CheckCircle, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const qc = useQueryClient();

  const [showAudit, setShowAudit] = useState(false);
  const [notes, setNotes] = useState('');
  const [infoRequest, setInfoRequest] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: app, isLoading, isError } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.get(id!),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit', id],
    queryFn: () => auditApi.byApplication(id!),
    enabled: showAudit,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['application', id] });
    qc.invalidateQueries({ queryKey: ['applications'] });
  };

  const submitMutation = useMutation({
    mutationFn: () => applicationsApi.submit(id!),
    onSuccess: () => { toast.success('Application submitted'); invalidate(); },
    onError: (e: unknown) => toast.error(apiErr(e)),
  });

  const startReviewMutation = useMutation({
    mutationFn: () => applicationsApi.startReview(id!),
    onSuccess: () => { toast.success('Review started'); invalidate(); },
    onError: (e: unknown) => toast.error(apiErr(e)),
  });

  const requestInfoMutation = useMutation({
    mutationFn: () => applicationsApi.requestInfo(id!, { additional_info_request: infoRequest, reviewer_notes: notes }),
    onSuccess: () => { toast.success('Info request sent'); setInfoRequest(''); setNotes(''); invalidate(); },
    onError: (e: unknown) => toast.error(apiErr(e)),
  });

  const completeReviewMutation = useMutation({
    mutationFn: () => applicationsApi.completeReview(id!, { reviewer_notes: notes }),
    onSuccess: () => { toast.success('Review completed'); setNotes(''); invalidate(); },
    onError: (e: unknown) => toast.error(apiErr(e)),
  });

  const approveMutation = useMutation({
    mutationFn: () => applicationsApi.approve(id!, { decision_notes: notes }),
    onSuccess: () => { toast.success('Application approved'); setNotes(''); invalidate(); },
    onError: (e: unknown) => toast.error(apiErr(e)),
  });

  const rejectMutation = useMutation({
    mutationFn: () => applicationsApi.reject(id!, { decision_notes: notes }),
    onSuccess: () => { toast.success('Application rejected'); setNotes(''); invalidate(); },
    onError: (e: unknown) => toast.error(apiErr(e)),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be 5MB or smaller');
      return;
    }
    setUploading(true);
    try {
      await documentsApi.upload(id!, file);
      toast.success('Document uploaded');
      qc.invalidateQueries({ queryKey: ['application', id] });
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (isError || !app) return <div className="p-8 text-red-600">Application not found.</div>;

  const isApplicant = hasRole(UserRole.APPLICANT) && app.applicant_id === user?.id;
  const isReviewer = hasRole(UserRole.REVIEWER);
  const isApprover = hasRole(UserRole.APPROVER);
  const canUpload = isApplicant && [ApplicationStatus.DRAFT, ApplicationStatus.ADDITIONAL_INFO_REQUIRED].includes(app.status);
  const isTerminal = [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED].includes(app.status);

  // Group documents by submission version
  const docsByVersion = (app.documents || []).reduce<Record<number, typeof app.documents>>((acc, doc) => {
    if (!doc) return acc;
    const v = doc.submission_version;
    if (!acc[v]) acc[v] = [];
    acc[v]!.push(doc);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => navigate('/applications')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} />Back to Applications
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{app.institution_name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-gray-500">{app.institution_type}</span>
            <span className="text-gray-300">•</span>
            <StatusBadge status={app.status} />
          </div>
        </div>
        {app.registration_number && (
          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {app.registration_number}
          </span>
        )}
      </div>

      {/* Additional info banner */}
      {app.status === ApplicationStatus.ADDITIONAL_INFO_REQUIRED && isApplicant && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-semibold text-orange-900">Additional Information Required</p>
              <p className="text-sm text-orange-800 mt-1">{app.additional_info_request}</p>
              <p className="text-xs text-orange-600 mt-2">Upload the requested documents and click "Resubmit Application".</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Details */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Application Details</h2>
            <dl className="space-y-3 text-sm">
              {app.description && <Row label="Description" value={app.description} />}
              {app.registered_address && <Row label="Registered Address" value={app.registered_address} />}
              {app.registration_number && <Row label="Registration No." value={app.registration_number} />}
              <Row label="Applicant" value={app.applicant?.full_name || app.applicant_id} />
              <Row label="Created" value={formatDate(app.created_at)} />
              <Row label="Last Updated" value={formatDate(app.updated_at)} />
              <Row label="Submission Round" value={String(app.submission_version)} />
            </dl>
          </section>

          {/* Review notes */}
          {app.reviewer_notes && (
            <section className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Reviewer Notes</h2>
              <p className="text-sm text-gray-700">{app.reviewer_notes}</p>
              {app.reviewer && <p className="text-xs text-gray-400 mt-2">— {app.reviewer.full_name}</p>}
            </section>
          )}

          {/* Decision notes */}
          {app.decision_notes && (
            <section className={`rounded-xl border p-6 ${app.status === ApplicationStatus.APPROVED ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                {app.status === ApplicationStatus.APPROVED
                  ? <CheckCircle className="text-green-600" size={18} />
                  : <XCircle className="text-red-600" size={18} />}
                <h2 className="text-sm font-semibold text-gray-700">Decision Notes</h2>
              </div>
              <p className="text-sm text-gray-700">{app.decision_notes}</p>
              {app.approver && <p className="text-xs text-gray-400 mt-2">— {app.approver.full_name}</p>}
            </section>
          )}

          {/* Documents */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Documents</h2>
              {canUpload && (
                <label className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer">
                  <Upload size={14} />
                  {uploading ? 'Uploading...' : 'Upload'}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                </label>
              )}
            </div>

            {Object.keys(docsByVersion).length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-sm text-gray-400">No documents uploaded yet.</p>
              </div>
            ) : (
              Object.entries(docsByVersion).sort(([a], [b]) => Number(b) - Number(a)).map(([version, docs]) => (
                <div key={version} className="mb-4">
                  <p className="text-xs font-medium text-gray-400 mb-2">
                    Submission Round {version} {Number(version) === app.submission_version ? '(current)' : '(previous)'}
                  </p>
                  <div className="space-y-2">
                    {docs?.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{doc.original_name}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(doc.size)}</span>
                        </div>
                        <a
                          href={documentsApi.downloadUrl(app.id, doc.id)}
                          download={doc.original_name}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 ml-2"
                        >
                          <Download size={12} />Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>

        {/* Sidebar: Actions */}
        <div className="space-y-4">
          {!isTerminal && (
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Actions</h2>

              {/* Notes textarea shown for reviewer/approver actions */}
              {(isReviewer && app.status === ApplicationStatus.UNDER_REVIEW) ||
               (isApprover && app.status === ApplicationStatus.REVIEWED) ? (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add notes..."
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                {/* APPLICANT actions */}
                {isApplicant && app.status === ApplicationStatus.DRAFT && (
                  <ActionButton onClick={() => submitMutation.mutate()} loading={submitMutation.isPending} variant="primary">
                    Submit Application
                  </ActionButton>
                )}
                {isApplicant && app.status === ApplicationStatus.ADDITIONAL_INFO_REQUIRED && (
                  <ActionButton onClick={() => submitMutation.mutate()} loading={submitMutation.isPending} variant="primary">
                    Resubmit Application
                  </ActionButton>
                )}

                {/* REVIEWER actions */}
                {isReviewer && app.status === ApplicationStatus.SUBMITTED && (
                  <ActionButton onClick={() => startReviewMutation.mutate()} loading={startReviewMutation.isPending} variant="primary">
                    Start Review
                  </ActionButton>
                )}
                {isReviewer && app.status === ApplicationStatus.UNDER_REVIEW && app.reviewer_id === user?.id && (
                  <>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Info Request (required)</label>
                      <textarea
                        value={infoRequest}
                        onChange={(e) => setInfoRequest(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe what's needed..."
                      />
                    </div>
                    <ActionButton
                      onClick={() => { if (!infoRequest.trim()) { toast.error('Info request is required'); return; } requestInfoMutation.mutate(); }}
                      loading={requestInfoMutation.isPending}
                      variant="secondary"
                    >
                      Request Additional Info
                    </ActionButton>
                    <ActionButton onClick={() => completeReviewMutation.mutate()} loading={completeReviewMutation.isPending} variant="primary">
                      Complete Review
                    </ActionButton>
                  </>
                )}

                {/* APPROVER actions */}
                {isApprover && app.status === ApplicationStatus.REVIEWED && app.reviewer_id !== user?.id && (
                  <>
                    <ActionButton onClick={() => approveMutation.mutate()} loading={approveMutation.isPending} variant="success">
                      Approve Application
                    </ActionButton>
                    <ActionButton onClick={() => rejectMutation.mutate()} loading={rejectMutation.isPending} variant="danger">
                      Reject Application
                    </ActionButton>
                  </>
                )}
                {isApprover && app.status === ApplicationStatus.REVIEWED && app.reviewer_id === user?.id && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    You reviewed this application. A different approver must make the final decision.
                  </div>
                )}
              </div>
            </section>
          )}

          {isTerminal && (
            <section className={`rounded-xl border p-5 ${app.status === ApplicationStatus.APPROVED ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                {app.status === ApplicationStatus.APPROVED
                  ? <CheckCircle className="text-green-600" size={20} />
                  : <XCircle className="text-red-600" size={20} />}
                <p className="font-semibold text-gray-900">
                  {app.status === ApplicationStatus.APPROVED ? 'Application Approved' : 'Application Rejected'}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">This decision is final and cannot be changed.</p>
            </section>
          )}

          {/* Audit Trail toggle */}
          <button
            onClick={() => setShowAudit((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="flex items-center gap-2"><Clock size={15} />Audit Trail</span>
            {showAudit ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showAudit && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 max-h-80 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No events recorded.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="text-xs border-l-2 border-blue-200 pl-3">
                    <p className="font-medium text-gray-800">{log.action.replace(/_/g, ' ')}</p>
                    {(log.previous_state || log.new_state) && (
                      <p className="text-gray-500">
                        {log.previous_state || '—'} → {log.new_state || '—'}
                      </p>
                    )}
                    <p className="text-gray-400">{log.actor?.full_name || log.actor_id} • {formatDate(log.timestamp)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-36 flex-shrink-0 text-gray-500">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  );
}

function ActionButton({
  onClick, loading, variant, children,
}: {
  onClick: () => void;
  loading: boolean;
  variant: 'primary' | 'secondary' | 'success' | 'danger';
  children: React.ReactNode;
}) {
  const cls = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${cls}`}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

function apiErr(e: unknown): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Something went wrong';
}
