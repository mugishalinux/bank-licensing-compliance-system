import api, { unwrap, unwrapPage } from './axios';
import { Application, ApplicationStatus, Envelope } from '../types';

export interface DecisionPayload {
  comment: string;
  attachment_key?: string;
  attachment_name?: string;
}

export const applicationsApi = {
  list: (q: {
    search?: string;
    status?: ApplicationStatus;
    license_type_id?: string;
    mine?: boolean;
    page?: number;
    pageSize?: number;
  } = {}) => api.get<Envelope<Application[]>>('/applications', { params: q }).then(unwrapPage),

  get: (id: string) =>
    api.get<Envelope<Application>>(`/applications/${id}`).then(unwrap),

  create: (license_type_id: string) =>
    api.post<Envelope<Application>>('/applications', { license_type_id }).then(unwrap),

  submit: (id: string) =>
    api.patch<Envelope<Application>>(`/applications/${id}/submit`).then(unwrap),

  startReview: (id: string) =>
    api.patch<Envelope<Application>>(`/applications/${id}/start-review`).then(unwrap),

  requestInfo: (id: string, dto: DecisionPayload) =>
    api.patch<Envelope<Application>>(`/applications/${id}/request-info`, dto).then(unwrap),

  completeReview: (id: string, dto: DecisionPayload) =>
    api.patch<Envelope<Application>>(`/applications/${id}/complete-review`, dto).then(unwrap),

  approve: (id: string, dto: DecisionPayload) =>
    api.patch<Envelope<Application>>(`/applications/${id}/approve`, dto).then(unwrap),

  reject: (id: string, dto: DecisionPayload) =>
    api.patch<Envelope<Application>>(`/applications/${id}/reject`, dto).then(unwrap),
};
