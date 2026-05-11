import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, FileText, Download, FileWarning } from 'lucide-react';
import { documentsApi } from '../../api/documents';
import { Application, ApplicationStatus, AppDocument, UserRole } from '../../types';
import { errorMessage, fmtSize, fmtRel } from '../../utils/formatters';
import Spinner from '../common/Spinner';
import { useAuth } from '../../context/AuthContext';

const EDITABLE = [ApplicationStatus.DRAFT, ApplicationStatus.ADDITIONAL_INFO_REQUIRED];

interface Props { app: Application }

export default function DocumentsPanel({ app }: Props) {
  const { user } = useAuth();
  const canUpload =
    user?.role === UserRole.APPLICANT &&
    app.applicant_id === user.id &&
    EDITABLE.includes(app.status);

  const docs = useQuery({
    queryKey: ['docs', app.id],
    queryFn: () => documentsApi.list(app.id),
  });

  const reqs = app.license_type?.requirements ?? [];
  const byReq = new Map<string | null, AppDocument[]>();
  for (const d of docs.data ?? []) {
    const k = d.requirement_id;
    const list = byReq.get(k) ?? [];
    list.push(d);
    byReq.set(k, list);
  }

  return (
    <div className="card">
      <div className="px-5 py-3 border-b border-[color:var(--color-bnr-line)]">
        <h2 className="font-medium text-[14px]">Documents</h2>
        <p className="text-[12px] text-[color:var(--color-ink-soft)] mt-0.5">
          PDF, JPG, PNG, DOC/DOCX. Max 5 MB per file.
        </p>
      </div>

      <div className="divide-y divide-[color:var(--color-bnr-line)]">
        {reqs.length === 0 ? (
          <UploadRow
            appId={app.id}
            label="Supporting documents"
            description="This license has no predefined requirements; attach any supporting documents."
            documents={byReq.get(null) ?? []}
            canUpload={canUpload}
          />
        ) : (
          <>
            {reqs.map((r) => (
              <UploadRow
                key={r.id}
                appId={app.id}
                requirementId={r.id}
                label={r.name}
                description={r.description ?? undefined}
                mandatory={r.is_mandatory}
                documents={byReq.get(r.id) ?? []}
                canUpload={canUpload && r.requires_attachment}
              />
            ))}
            {(byReq.get(null)?.length ?? 0) > 0 && (
              <UploadRow
                appId={app.id}
                label="Other supporting documents"
                documents={byReq.get(null) ?? []}
                canUpload={canUpload}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface RowProps {
  appId: string;
  requirementId?: string;
  label: string;
  description?: string;
  mandatory?: boolean;
  documents: AppDocument[];
  canUpload: boolean;
}

function UploadRow({ appId, requirementId, label, description, mandatory, documents, canUpload }: RowProps) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = useMutation({
    mutationFn: (file: File) => documentsApi.upload(appId, file, requirementId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['docs', appId] });
      toast.success('Document uploaded');
    },
    onError: (e) => toast.error(errorMessage(e, 'Upload failed')),
    onSettled: () => setBusy(false),
  });

  const onPick = (f: File | null) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File exceeds 5 MB');
      return;
    }
    setBusy(true);
    upload.mutate(f);
  };

  const download = async (docId: string, name: string) => {
    try {
      const { url } = await documentsApi.downloadUrl(appId, docId);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
    } catch (e) {
      toast.error(errorMessage(e, 'Could not get download link'));
    }
  };

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-[13px]">{label}</span>
            {mandatory && <span className="tag bg-red-50 text-red-700">Required</span>}
            {documents.length > 0 && (
              <span className="tag bg-emerald-50 text-emerald-700">{documents.length} uploaded</span>
            )}
          </div>
          {description && (
            <p className="text-[12px] text-[color:var(--color-ink-soft)] mt-1">{description}</p>
          )}
        </div>
        {canUpload && (
          <div className="shrink-0">
            <input
              ref={fileRef}
              type="file"
              hidden
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => { onPick(e.target.files?.[0] ?? null); if (fileRef.current) fileRef.current.value = ''; }}
            />
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? <Spinner size={14} /> : <Upload size={14} />} Upload
            </button>
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        mandatory && !canUpload ? (
          <div className="mt-3 flex items-center gap-2 text-[12px] text-amber-700">
            <FileWarning size={13} /> No document uploaded
          </div>
        ) : null
      ) : (
        <ul className="mt-3 space-y-1.5">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-[12px]">
              <FileText size={13} className="text-[color:var(--color-ink-soft)] shrink-0" />
              <button onClick={() => download(d.id, d.original_name)} className="text-bnr hover:underline truncate">
                {d.original_name}
              </button>
              <span className="text-[color:var(--color-ink-soft)]">· {fmtSize(d.size)}</span>
              <span className="text-[color:var(--color-ink-soft)]">· v{d.submission_version}</span>
              <span className="text-[color:var(--color-ink-soft)]">· {fmtRel(d.created_at)}</span>
              <Download size={13} className="text-[color:var(--color-ink-soft)] ml-auto" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
