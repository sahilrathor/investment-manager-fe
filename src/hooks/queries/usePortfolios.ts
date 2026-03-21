import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { queryKeys } from '@/lib/queryKeys';

export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface CreatePortfolioPayload {
  name: string;
  description?: string;
}

export function usePortfolios() {
  return useQuery({
    queryKey: queryKeys.portfolios.lists(),
    queryFn: () => api.get<Portfolio[]>('/portfolios'),
  });
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: queryKeys.portfolios.detail(id),
    queryFn: () => api.get<Portfolio>(`/portfolios/${id}`),
    enabled: !!id,
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePortfolioPayload) =>
      api.post<Portfolio, CreatePortfolioPayload>('/portfolios', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.portfolios.lists() }),
  });
}

export function useUpdatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePortfolioPayload> }) =>
      api.put<Portfolio>(`/portfolios/${id}`, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.portfolios.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.portfolios.lists() });
    },
  });
}

export function useDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/portfolios/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.portfolios.lists() }),
  });
}
