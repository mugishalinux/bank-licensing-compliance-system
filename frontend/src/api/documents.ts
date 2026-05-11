import api, { unwrap } from './axios';
import { AppDocument, Envelope, PresignResult } from '../types';

export const documentsApi = {
  list: (appId: string) =>
    api.get<Envelope<AppDocument[]>>(`/applications/${appId}/documents`).then(unwrap),

  presign: (appId: string, dto: {
    original_name: string;
    mime_type: string;
    size: number;
    requirement_id?: string;
  }) => api.post<Envelope<PresignResult>>(`/applications/${appId}/documents/presign-upload`, dto).then(unwrap),

  confirm: (appId: string, docId: string) =>
    api.post<Envelope<AppDocument>>(`/applications/${appId}/documents/${docId}/confirm`, {}).then(unwrap),

  downloadUrl: (appId: string, docId: string) =>
    api
      .get<Envelope<{ url: string; expires_in: number }>>(
        `/applications/${appId}/documents/${docId}/download-url`,
      )
      .then(unwrap),

  upload: async (appId: string, file: File, requirementId?: string): Promise<AppDocument> => {
    const presign = await documentsApi.presign(appId, {
      original_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      size: file.size,
      requirement_id: requirementId,
    });
    const put = await fetch(presign.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!put.ok) throw new Error(`Upload failed (${put.status})`);
    return documentsApi.confirm(appId, presign.document_id);
  },
};
