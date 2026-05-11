import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, Clock, Banknote, Mail, Phone, Send } from 'lucide-react';
import { applicationsApi } from '../api/applications';
import { Application, ApplicationStatus, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { errorMessage, fmtDate, fmtMoney } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';
import { PageLoader } from '../components/common/Spinner';
import Confirm from '../components/common/Confirm';
import DocumentsPanel from '../components/application/DocumentsPanel';
import CommentsPanel from '../components/application/CommentsPanel';
import ActionsPanel from '../components/application/ActionsPanel';

const SUBMITTABLE = [ApplicationStatus.DRAFT, ApplicationStatus.ADDITIONAL_INFO_REQUIRED];

export default function ApplicationDetailPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const q = useQuery({
    queryKey: ['app', id],
    queryFn: () => applicationsApi.get(id),
    enabled: !!id,
  });

  const submit = useMutation({
    mutationFn: () => applicationsApi.submit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app', id] });
      qc.invalidateQueries({ queryKey: ['apps'] });
      setConfirmSubmit(false);
      toast.success('Application submitted');
    },
    onError: (e) => { toast.error(errorMessage(e, 'Could not submit')); setConfirmSubmit(false); },
  });

  if (q.isLoading) return <PageLoader />;
  if (!q.data) return <div className="p-8">Application not found.</div>;

  const a = q.data;
  const isOwner = user?.id === a.applicant_id;
  const canSubmit =
    user?.role === UserRole.APPLICANT && isOwner && SUBMITTABLE.includes(a.status);

  return (
    <div>
      <Link to="/applications" className="text-[12px] inline-flex items-center gap-1 text-[color:var(--color-ink-soft)] hover:text-bnr mb-3">
        <ArrowLeft size={13} /> Back to applications
      </Link>

      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[13px] text-bnr">{a.reference_id}</span>
            <StatusBadge status={a.status} />
          </div>
          <h1 className="text-xl font-semibold">{a.license_type?.name ?? 'License application'}</h1>
          <p className="text-[13px] text-[color:var(--color-ink-soft)] mt-0.5">
            {a.department?.name} · created {fmtDate(a.created_at)}
            {a.submitted_at && ` · submitted ${fmtDate(a.submitted_at)}`}
            {a.decided_at && ` · decided ${fmtDate(a.decided_at)}`}
          </p>
        </div>

        {canSubmit && (
          <button className="btn btn-primary" onClick={() => setConfirmSubmit(true)}>
            <Send size={15} /> {a.status === ApplicationStatus.DRAFT ? 'Submit application' : 'Resubmit'}
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <DocumentsPanel app={a} />
          <CommentsPanel app={a} />
        </div>

        <aside className="space-y-5">
          <ActionsPanel app={a} />
          <ApplicantCard app={a} />
          <LicenseCard app={a} />
          {(a.reviewer || a.approver) && <AssignmentCard app={a} />}
        </aside>
      </div>

      <Confirm
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={() => submit.mutate()}
        title={a.status === ApplicationStatus.DRAFT ? 'Submit application' : 'Resubmit application'}
        message={
          a.status === ApplicationStatus.DRAFT
            ? 'Once submitted, you will not be able to edit or upload more documents until a reviewer responds.'
            : 'Confirm that you have addressed the additional information request.'
        }
        confirmLabel={a.status === ApplicationStatus.DRAFT ? 'Submit' : 'Resubmit'}
        busy={submit.isPending}
      />
    </div>
  );
}

function ApplicantCard({ app }: { app: Application }) {
  return (
    <div className="card">
      <div className="px-5 py-3 border-b border-[color:var(--color-bnr-line)]">
        <h3 className="font-medium text-[14px]">Applicant</h3>
      </div>
      <dl className="px-5 py-4 space-y-2 text-[13px]">
        <Row label="Name">{app.applicant_name_snapshot}</Row>
        {app.institution_name_snapshot && (
          <Row label="Institution"><span className="inline-flex items-center gap-1.5"><Building2 size={13} /> {app.institution_name_snapshot}</span></Row>
        )}
        <Row label="Email"><span className="inline-flex items-center gap-1.5"><Mail size={13} /> {app.email_snapshot}</span></Row>
        {app.phone_snapshot && (
          <Row label="Phone"><span className="inline-flex items-center gap-1.5"><Phone size={13} /> {app.phone_snapshot}</span></Row>
        )}
      </dl>
    </div>
  );
}

function LicenseCard({ app }: { app: Application }) {
  const lt = app.license_type;
  return (
    <div className="card">
      <div className="px-5 py-3 border-b border-[color:var(--color-bnr-line)]">
        <h3 className="font-medium text-[14px]">License</h3>
      </div>
      <dl className="px-5 py-4 space-y-2 text-[13px]">
        <Row label="Type">{lt?.name ?? '—'}</Row>
        <Row label="Department">{app.department?.name ?? '—'}</Row>
        {lt && (
          <>
            <Row label="Processing"><span className="inline-flex items-center gap-1.5"><Clock size={13} /> {lt.processing_time_days} days</span></Row>
            <Row label="Fee"><span className="inline-flex items-center gap-1.5"><Banknote size={13} /> {fmtMoney(lt.is_paid ? lt.fee_amount : null)}</span></Row>
          </>
        )}
        <Row label="Version">v{app.submission_version}</Row>
      </dl>
    </div>
  );
}

function AssignmentCard({ app }: { app: Application }) {
  return (
    <div className="card">
      <div className="px-5 py-3 border-b border-[color:var(--color-bnr-line)]">
        <h3 className="font-medium text-[14px]">Assignment</h3>
      </div>
      <dl className="px-5 py-4 space-y-2 text-[13px]">
        {app.reviewer && <Row label="Reviewer">{app.reviewer.full_name}</Row>}
        {app.approver && <Row label="Approver">{app.approver.full_name}</Row>}
      </dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[color:var(--color-ink-soft)] text-[12px]">{label}</dt>
      <dd className="text-right truncate">{children}</dd>
    </div>
  );
}
