import api, { unwrap } from './axios';
import { AuditLog, Envelope } from '../types';

export const auditApi = {
  list: (q: { page?: number; limit?: number } = {}) =>
    api
      .get<Envelope<{ data: AuditLog[]; total: number }>>('/audit', { params: q })
      .then(unwrap),

  byApplication: (id: string) =>
    api.get<Envelope<AuditLog[]>>(`/audit/application/${id}`).then(unwrap),
};
