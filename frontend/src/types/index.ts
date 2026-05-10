export enum UserRole {
  APPLICANT = 'APPLICANT',
  REVIEWER = 'REVIEWER',
  APPROVER = 'APPROVER',
  ADMIN = 'ADMIN',
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

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  original_name: string;
  stored_name: string;
  size: number;
  mime_type: string;
  uploader_id: string;
  uploader?: User;
  submission_version: number;
  uploaded_at: string;
}

export interface Application {
  id: string;
  institution_name: string;
  institution_type: string;
  description: string | null;
  registered_address: string | null;
  registration_number: string | null;
  status: ApplicationStatus;
  applicant_id: string;
  applicant?: User;
  reviewer_id: string | null;
  reviewer?: User | null;
  approver_id: string | null;
  approver?: User | null;
  reviewer_notes: string | null;
  additional_info_request: string | null;
  decision_notes: string | null;
  submission_version: number;
  version: number;
  created_at: string;
  updated_at: string;
  documents?: ApplicationDocument[];
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}
