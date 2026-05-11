export enum UserRole {
  APPLICANT = 'APPLICANT',
  REVIEWER = 'REVIEWER',
  APPROVER = 'APPROVER',
  ADMIN = 'ADMIN',
}

export enum ApplicantType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATION = 'ORGANIZATION',
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum CommentKind {
  INFO_REQUEST = 'INFO_REQUEST',
  REVIEW_NOTE = 'REVIEW_NOTE',
  APPROVAL = 'APPROVAL',
  REJECTION = 'REJECTION',
  APPLICANT_REPLY = 'APPLICANT_REPLY',
}

export enum DocumentStatus {
  PENDING_UPLOAD = 'PENDING_UPLOAD',
  READY = 'READY',
  REJECTED = 'REJECTED',
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstitutionType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LicenseRequirement {
  id: string;
  license_type_id: string;
  name: string;
  description: string | null;
  is_mandatory: boolean;
  requires_attachment: boolean;
  created_at: string;
  updated_at: string;
}

export interface LicenseType {
  id: string;
  name: string;
  description: string | null;
  department_id: string;
  department?: Department;
  processing_time_days: number;
  is_paid: boolean;
  fee_amount: string | null;
  is_active: boolean;
  requirements?: LicenseRequirement[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  department_id: string | null;
  department?: Department | null;
  applicant_type: ApplicantType | null;
  institution_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AppDocument {
  id: string;
  application_id: string;
  requirement_id: string | null;
  original_name: string;
  object_key: string;
  size: string;
  mime_type: string;
  status: DocumentStatus;
  uploader_id: string;
  uploader?: User;
  submission_version: number;
  created_at: string;
}

export interface Comment {
  id: string;
  application_id: string;
  author_id: string;
  author?: User;
  kind: CommentKind;
  body: string;
  attachment_key: string | null;
  attachment_name: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  reference_id: string;
  applicant_id: string;
  applicant?: User;
  license_type_id: string;
  license_type?: LicenseType;
  department_id: string;
  department?: Department;
  applicant_name_snapshot: string;
  institution_name_snapshot: string | null;
  email_snapshot: string;
  phone_snapshot: string | null;
  status: ApplicationStatus;
  reviewer_id: string | null;
  reviewer?: User | null;
  approver_id: string | null;
  approver?: User | null;
  submission_version: number;
  version: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  decided_at: string | null;
  documents?: AppDocument[];
  comments?: Comment[];
}

export interface AuditLog {
  id: string;
  application_id: string | null;
  actor_id: string;
  actor?: User;
  action: string;
  previous_state: string | null;
  new_state: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  timestamp: string;
}

export interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: PageMeta;
  timestamp: string;
}

export interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface PresignResult {
  document_id: string;
  object_key: string;
  upload_url: string;
  expires_in: number;
}
