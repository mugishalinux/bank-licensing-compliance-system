import { ApplicationStatus, CommentKind, UserRole } from '../types';
import { format, formatDistanceToNow } from 'date-fns';

export function fmtDate(d: string | Date): string {
  return format(new Date(d), 'dd MMM yyyy, HH:mm');
}

export function fmtRel(d: string | Date): string {
  return formatDistanceToNow(new Date(d), { addSuffix: true });
}

export function fmtSize(bytes: number | string): string {
  const n = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function fmtMoney(amount: string | null, currency = 'RWF'): string {
  if (!amount) return 'Free';
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  return `${currency} ${n.toLocaleString('en-RW')}`;
}

export function errorMessage(e: unknown, fallback = 'Something went wrong'): string {
  const r = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(r)) return r.join(', ');
  if (typeof r === 'string') return r;
  if (e instanceof Error) return e.message;
  return fallback;
}

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'Draft',
  [ApplicationStatus.SUBMITTED]: 'Submitted',
  [ApplicationStatus.UNDER_REVIEW]: 'Under review',
  [ApplicationStatus.ADDITIONAL_INFO_REQUIRED]: 'Info requested',
  [ApplicationStatus.REVIEWED]: 'Reviewed',
  [ApplicationStatus.APPROVED]: 'Approved',
  [ApplicationStatus.REJECTED]: 'Rejected',
};

export const STATUS_CLASS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'bg-gray-100 text-gray-700',
  [ApplicationStatus.SUBMITTED]: 'bg-blue-100 text-blue-700',
  [ApplicationStatus.UNDER_REVIEW]: 'bg-amber-100 text-amber-700',
  [ApplicationStatus.ADDITIONAL_INFO_REQUIRED]: 'bg-orange-100 text-orange-700',
  [ApplicationStatus.REVIEWED]: 'bg-purple-100 text-purple-700',
  [ApplicationStatus.APPROVED]: 'bg-emerald-100 text-emerald-700',
  [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-700',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.APPLICANT]: 'Applicant',
  [UserRole.REVIEWER]: 'Reviewer',
  [UserRole.APPROVER]: 'Approver',
  [UserRole.ADMIN]: 'Admin',
};

export const COMMENT_LABEL: Record<CommentKind, string> = {
  [CommentKind.INFO_REQUEST]: 'Information requested',
  [CommentKind.REVIEW_NOTE]: 'Review note',
  [CommentKind.APPROVAL]: 'Approved',
  [CommentKind.REJECTION]: 'Rejected',
  [CommentKind.APPLICANT_REPLY]: 'Applicant reply',
};
