import api from './axios';
import { ApiResponse, ApplicationDocument } from '../types';

export const documentsApi = {
  list: async (applicationId: string): Promise<ApplicationDocument[]> => {
    const res = await api.get<ApiResponse<ApplicationDocument[]>>(
      `/applications/${applicationId}/documents`,
    );
    return res.data.data;
  },

  upload: async (applicationId: string, file: File): Promise<ApplicationDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<ApplicationDocument>>(
      `/applications/${applicationId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data.data;
  },

  downloadUrl: (applicationId: string, docId: string): string =>
    `/api/applications/${applicationId}/documents/${docId}/download`,
};
