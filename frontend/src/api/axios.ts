import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Envelope } from '../types';

const ACCESS = 'access_token';
const REFRESH = 'refresh_token';

export const tokens = {
  get access() { return localStorage.getItem(ACCESS); },
  get refresh() { return localStorage.getItem(REFRESH); },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem('user');
  },
};

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((cfg) => {
  const t = tokens.access;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing: Promise<string> | null = null;

async function tryRefresh(): Promise<string> {
  const rt = tokens.refresh;
  if (!rt) throw new Error('no refresh token');
  const res = await axios.post<Envelope<{ access_token: string; refresh_token: string }>>(
    '/api/auth/refresh',
    { refresh_token: rt },
  );
  const { access_token, refresh_token } = res.data.data;
  tokens.set(access_token, refresh_token);
  return access_token;
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const cfg = err.config as AxiosRequestConfig & { _retried?: boolean };
    const url = cfg?.url ?? '';
    const isAuthCall = url.includes('/auth/');
    if (err.response?.status !== 401 || cfg._retried || isAuthCall || !tokens.refresh) {
      if (err.response?.status === 401 && !isAuthCall) {
        tokens.clear();
        if (location.pathname !== '/login') location.href = '/login';
      }
      return Promise.reject(err);
    }

    cfg._retried = true;
    try {
      refreshing = refreshing ?? tryRefresh();
      const fresh = await refreshing;
      refreshing = null;
      cfg.headers = { ...(cfg.headers ?? {}), Authorization: `Bearer ${fresh}` };
      return api(cfg);
    } catch (e) {
      refreshing = null;
      tokens.clear();
      if (location.pathname !== '/login') location.href = '/login';
      return Promise.reject(e);
    }
  },
);

export function unwrap<T>(r: { data: Envelope<T> }): T {
  return r.data.data;
}

export function unwrapPage<T>(r: { data: Envelope<T[]> }): { items: T[]; meta: NonNullable<{ data: Envelope<T[]> }['data']['pagination']> } {
  const meta = r.data.pagination ?? {
    total: r.data.data.length,
    page: 1,
    pageSize: r.data.data.length,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };
  return { items: r.data.data, meta };
}

export default api;
