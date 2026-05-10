import { ApplicationStatus } from '../types';
import { formatDistanceToNow, format } from 'date-fns';

export function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
}

export function formatRelative(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'Draft',
  [ApplicationStatus.SUBMITTED]: 'Submitted',
  [ApplicationStatus.UNDER_REVIEW]: 'Under Review',
  [ApplicationStatus.ADDITIONAL_INFO_REQUIRED]: 'Additional Info Required',
  [ApplicationStatus.REVIEWED]: 'Reviewed',
  [ApplicationStatus.APPROVED]: 'Approved',
  [ApplicationStatus.REJECTED]: 'Rejected',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'bg-gray-100 text-gray-700',
  [ApplicationStatus.SUBMITTED]: 'bg-blue-100 text-blue-700',
  [ApplicationStatus.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-700',
  [ApplicationStatus.ADDITIONAL_INFO_REQUIRED]: 'bg-orange-100 text-orange-700',
  [ApplicationStatus.REVIEWED]: 'bg-purple-100 text-purple-700',
  [ApplicationStatus.APPROVED]: 'bg-green-100 text-green-700',
  [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-700',
};
