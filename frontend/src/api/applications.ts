import api from './axios';
import { ApiResponse, Application } from '../types';

export const applicationsApi = {
  list: async (): Promise<Application[]> => {
    const res = await api.get<ApiResponse<Application[]>>('/applications');
    return res.data.data;
  },

  get: async (id: string): Promise<Application> => {
    const res = await api.get<ApiResponse<Application>>(`/applications/${id}`);
    return res.data.data;
  },

  create: async (data: {
    institution_name: string;
    institution_type: string;
    description?: string;
    registered_address?: string;
    registration_number?: string;
  }): Promise<Application> => {
    const res = await api.post<ApiResponse<Application>>('/applications', data);
    return res.data.data;
  },

  submit: async (id: string): Promise<Application> => {
    const res = await api.patch<ApiResponse<Application>>(`/applications/${id}/submit`);
    return res.data.data;
  },

  startReview: async (id: string): Promise<Application> => {
    const res = await api.patch<ApiResponse<Application>>(`/applications/${id}/start-review`);
    return res.data.data;
  },

  requestInfo: async (id: string, data: { additional_info_request: string; reviewer_notes?: string }): Promise<Application> => {
    const res = await api.patch<ApiResponse<Application>>(`/applications/${id}/request-info`, data);
    return res.data.data;
  },

  completeReview: async (id: string, data: { reviewer_notes?: string }): Promise<Application> => {
    const res = await api.patch<ApiResponse<Application>>(`/applications/${id}/complete-review`, data);
    return res.data.data;
  },

  approve: async (id: string, data: { decision_notes?: string }): Promise<Application> => {
    const res = await api.patch<ApiResponse<Application>>(`/applications/${id}/approve`, data);
    return res.data.data;
  },

  reject: async (id: string, data: { decision_notes?: string }): Promise<Application> => {
    const res = await api.patch<ApiResponse<Application>>(`/applications/${id}/reject`, data);
    return res.data.data;
  },
};
