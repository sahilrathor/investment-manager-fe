import axios, { AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { envConfig } from '@/config/envConfig';

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiServiceOptions<TBody = unknown> {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: TBody;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) reject(error);
    else resolve(axiosInstance(config));
  });
  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: envConfig.API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${envConfig.API_BASE_URL}/auth/refresh`, { refreshToken });
        const { token, refreshToken: newRefreshToken } = response.data.data;

        Cookies.set('access_token', token, { expires: 1 / 96 });
        Cookies.set('refresh_token', newRefreshToken, { expires: 7 });

        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const apiError: ApiError = {
      message: (error.response?.data as any)?.message || error.message || 'Unexpected error',
      status: error.response?.status || 500,
      code: (error.response?.data as any)?.code,
    };

    return Promise.reject(apiError);
  }
);

export async function apiService<TResponse, TBody = unknown>({
  endpoint,
  method = 'GET',
  body,
  headers = {},
  params,
  signal,
}: ApiServiceOptions<TBody>): Promise<TResponse> {
  const config: AxiosRequestConfig = {
    url: endpoint,
    method,
    headers,
    params,
    signal,
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    config.data = body;
  }

  const response = await axiosInstance<ApiResponse<TResponse>>(config);
  return response.data.data;
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, unknown>, headers?: Record<string, string>) =>
    apiService<T>({ endpoint, method: 'GET', params, headers }),

  post: <T, B = unknown>(endpoint: string, body?: B, headers?: Record<string, string>) =>
    apiService<T, B>({ endpoint, method: 'POST', body, headers }),

  put: <T, B = unknown>(endpoint: string, body?: B, headers?: Record<string, string>) =>
    apiService<T, B>({ endpoint, method: 'PUT', body, headers }),

  patch: <T, B = unknown>(endpoint: string, body?: B, headers?: Record<string, string>) =>
    apiService<T, B>({ endpoint, method: 'PATCH', body, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiService<T>({ endpoint, method: 'DELETE', headers }),
};
