import api from './axios';
import { ApiResponse, User, UserRole } from '../types';

export const usersApi = {
  list: async (): Promise<User[]> => {
    const res = await api.get<ApiResponse<User[]>>('/users');
    return res.data.data;
  },

  create: async (data: {
    email: string;
    password: string;
    role: UserRole;
    full_name: string;
  }): Promise<User> => {
    const res = await api.post<ApiResponse<User>>('/users', data);
    return res.data.data;
  },

  deactivate: async (id: string): Promise<void> => {
    await api.patch(`/users/${id}/deactivate`);
  },

  activate: async (id: string): Promise<void> => {
    await api.patch(`/users/${id}/activate`);
  },
};
