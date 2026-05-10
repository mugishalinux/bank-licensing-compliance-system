import api from './axios';
import { ApiResponse, AuditLog, PaginatedResponse } from '../types';

export const auditApi = {
  list: async (page = 1, limit = 50): Promise<PaginatedResponse<AuditLog>> => {
    const res = await api.get<ApiResponse<PaginatedResponse<AuditLog>>>(
      `/audit?page=${page}&limit=${limit}`,
    );
    return res.data.data;
  },

  byApplication: async (applicationId: string): Promise<AuditLog[]> => {
    const res = await api.get<ApiResponse<AuditLog[]>>(`/audit/application/${applicationId}`);
    return res.data.data;
  },
};
