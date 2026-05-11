import api, { unwrap, unwrapPage } from './axios';
import { ApplicantType, Envelope, User, UserRole } from '../types';

export const usersApi = {
  list: (q: {
    search?: string;
    role?: UserRole;
    department_id?: string;
    is_active?: boolean;
    page?: number;
    pageSize?: number;
  } = {}) => api.get<Envelope<User[]>>('/users', { params: q }).then(unwrapPage),

  get: (id: string) =>
    api.get<Envelope<User>>(`/users/${id}`).then(unwrap),

  create: (dto: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    department_id?: string;
    applicant_type?: ApplicantType;
    institution_name?: string;
  }) => api.post<Envelope<User>>('/users', dto).then(unwrap),

  update: (id: string, dto: Partial<{
    full_name: string;
    phone: string;
    department_id: string | null;
    applicant_type: ApplicantType | null;
    institution_name: string | null;
    is_active: boolean;
  }>) => api.patch<Envelope<User>>(`/users/${id}`, dto).then(unwrap),

  deactivate: (id: string) =>
    api.patch<Envelope<{ message: string }>>(`/users/${id}/deactivate`).then(unwrap),

  activate: (id: string) =>
    api.patch<Envelope<{ message: string }>>(`/users/${id}/activate`).then(unwrap),
};
