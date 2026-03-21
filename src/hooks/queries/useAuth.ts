import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore, User } from '@/stores/useAuthStore';
import { endpointsConfig } from '@/config/endpointsConfig';
import Cookies from 'js-cookie';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export function useLogin() {
  const qc = useQueryClient();
  const { setData } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      api.post<AuthResponse, LoginCredentials>(endpointsConfig.AUTH.LOGIN, credentials),
    onSuccess: (data) => {
      Cookies.set('access_token', data.token, { expires: 1 / 96 });
      Cookies.set('refresh_token', data.refreshToken, { expires: 7 });
      setData({ user: data.user, isAuthenticated: true });
      qc.setQueryData(queryKeys.auth.me(), data.user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  const { setData } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      api.post<AuthResponse, RegisterCredentials>(endpointsConfig.AUTH.REGISTER, credentials),
    onSuccess: (data) => {
      Cookies.set('access_token', data.token, { expires: 1 / 96 });
      Cookies.set('refresh_token', data.refreshToken, { expires: 7 });
      setData({ user: data.user, isAuthenticated: true });
      qc.setQueryData(queryKeys.auth.me(), data.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const { reset } = useAuthStore();

  return useMutation({
    mutationFn: () => {
      const refreshToken = Cookies.get('refresh_token');
      return api.post(endpointsConfig.AUTH.LOGOUT, { refreshToken });
    },
    onSettled: () => {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      reset();
      qc.clear();
    },
  });
}

export function useAuthCheck() {
  const { data: authData, setData } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => api.get<User>(endpointsConfig.AUTH.ME),
    retry: false,
    staleTime: Infinity,
    enabled: !!Cookies.get('access_token') && !authData.isAuthenticated,
  });
}
