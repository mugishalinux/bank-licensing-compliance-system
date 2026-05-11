import api, { unwrap } from './axios';
import { Comment, Envelope } from '../types';

export const commentsApi = {
  list: (appId: string) =>
    api.get<Envelope<Comment[]>>(`/applications/${appId}/comments`).then(unwrap),

  add: (appId: string, dto: { body: string; attachment_key?: string; attachment_name?: string }) =>
    api.post<Envelope<Comment>>(`/applications/${appId}/comments`, dto).then(unwrap),
};
