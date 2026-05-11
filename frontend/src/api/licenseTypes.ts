import api, { unwrap, unwrapPage } from './axios';
import { Envelope, LicenseRequirement, LicenseType } from '../types';

export const licenseTypesApi = {
  list: (q: { search?: string; department_id?: string; is_active?: boolean; page?: number; pageSize?: number } = {}) =>
    api.get<Envelope<LicenseType[]>>('/license-types', { params: q }).then(unwrapPage),

  get: (id: string) =>
    api.get<Envelope<LicenseType>>(`/license-types/${id}`).then(unwrap),

  create: (dto: {
    name: string;
    department_id: string;
    processing_time_days: number;
    is_paid: boolean;
    description?: string;
    fee_amount?: string;
  }) => api.post<Envelope<LicenseType>>('/license-types', dto).then(unwrap),

  update: (id: string, dto: Partial<{
    name: string;
    description: string;
    department_id: string;
    processing_time_days: number;
    is_paid: boolean;
    fee_amount: string;
    is_active: boolean;
  }>) => api.patch<Envelope<LicenseType>>(`/license-types/${id}`, dto).then(unwrap),

  deactivate: (id: string) =>
    api.delete<Envelope<{ message: string }>>(`/license-types/${id}`).then(unwrap),

  listRequirements: (typeId: string) =>
    api.get<Envelope<LicenseRequirement[]>>(`/license-types/${typeId}/requirements`).then(unwrap),

  addRequirement: (typeId: string, dto: {
    name: string;
    description?: string;
    is_mandatory?: boolean;
    requires_attachment?: boolean;
  }) => api.post<Envelope<LicenseRequirement>>(`/license-types/${typeId}/requirements`, dto).then(unwrap),

  updateRequirement: (id: string, dto: Partial<{
    name: string;
    description: string;
    is_mandatory: boolean;
    requires_attachment: boolean;
  }>) => api.patch<Envelope<LicenseRequirement>>(`/license-requirements/${id}`, dto).then(unwrap),

  removeRequirement: (id: string) =>
    api.delete<Envelope<{ message: string }>>(`/license-requirements/${id}`).then(unwrap),
};
