import api, { unwrap, unwrapPage } from './axios';
import { Department, Envelope } from '../types';

export const departmentsApi = {
  list: (q: { search?: string; is_active?: boolean; page?: number; pageSize?: number } = {}) =>
    api.get<Envelope<Department[]>>('/departments', { params: q }).then(unwrapPage),

  get: (id: string) =>
    api.get<Envelope<Department>>(`/departments/${id}`).then(unwrap),

  create: (dto: { name: string; code: string; description?: string }) =>
    api.post<Envelope<Department>>('/departments', dto).then(unwrap),

  update: (id: string, dto: Partial<{ name: string; code: string; description: string; is_active: boolean }>) =>
    api.patch<Envelope<Department>>(`/departments/${id}`, dto).then(unwrap),

  deactivate: (id: string) =>
    api.delete<Envelope<{ message: string }>>(`/departments/${id}`).then(unwrap),
};
