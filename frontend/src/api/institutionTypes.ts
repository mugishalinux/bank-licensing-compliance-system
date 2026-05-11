import api, { unwrap, unwrapPage } from './axios';
import { Envelope, InstitutionType } from '../types';

export const institutionTypesApi = {
  list: (q: { search?: string; is_active?: boolean; page?: number; pageSize?: number } = {}) =>
    api.get<Envelope<InstitutionType[]>>('/institution-types', { params: q }).then(unwrapPage),

  get: (id: string) =>
    api.get<Envelope<InstitutionType>>(`/institution-types/${id}`).then(unwrap),

  create: (dto: { name: string; description?: string }) =>
    api.post<Envelope<InstitutionType>>('/institution-types', dto).then(unwrap),

  update: (id: string, dto: Partial<{ name: string; description: string; is_active: boolean }>) =>
    api.patch<Envelope<InstitutionType>>(`/institution-types/${id}`, dto).then(unwrap),

  deactivate: (id: string) =>
    api.delete<Envelope<{ message: string }>>(`/institution-types/${id}`).then(unwrap),
};
