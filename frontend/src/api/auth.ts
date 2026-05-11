import api, { unwrap } from './axios';
import { ApplicantType, AuthTokens, Envelope, User } from '../types';

export const authApi = {
  register: (dto: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    applicant_type: ApplicantType;
    institution_name?: string;
  }) => api.post<Envelope<{ id: string }>>('/auth/register', dto).then(unwrap),

  requestLoginOtp: (email: string, password: string) =>
    api.post<Envelope<{ message: string }>>('/auth/request-login-otp', { email, password }).then(unwrap),

  confirmLoginOtp: (email: string, otp: string) =>
    api.post<Envelope<AuthTokens>>('/auth/confirm-login-otp', { email, otp }).then(unwrap),

  requestPasswordReset: (email: string) =>
    api.post<Envelope<{ message: string }>>('/auth/request-password-reset', { email }).then(unwrap),

  confirmPasswordReset: (email: string, otp: string, new_password: string) =>
    api
      .post<Envelope<{ message: string }>>('/auth/confirm-password-reset', { email, otp, new_password })
      .then(unwrap),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<Envelope<User>>('/auth/me').then(unwrap),
};
