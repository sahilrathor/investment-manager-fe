import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { queryKeys } from '@/lib/queryKeys';
import { endpointsConfig } from '@/config/endpointsConfig';

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

export interface PortfolioAnalytics {
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  returnPercent: number;
  bestPerformer: { symbol: string; pnlPercent: number } | null;
  worstPerformer: { symbol: string; pnlPercent: number } | null;
  allocation: { symbol: string; name: string; value: number; percent: number }[];
  stockVsCrypto: { stocks: number; crypto: number };
}

export interface PortfolioPerformancePoint {
  date: string;
  value: number;
  invested: number;
}

export function usePortfolios() {
  return useQuery({
    queryKey: queryKeys.portfolios.lists(),
    queryFn: () => api.get<Portfolio[]>(endpointsConfig.PORTFOLIOS.LIST),
  });
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: queryKeys.portfolios.detail(id),
    queryFn: () => api.get<Portfolio>(endpointsConfig.PORTFOLIOS.GET(id)),
    enabled: !!id,
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePortfolioPayload) =>
      api.post<Portfolio, CreatePortfolioPayload>(endpointsConfig.PORTFOLIOS.CREATE, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.portfolios.lists() }),
  });
}

export function useUpdatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePortfolioPayload> }) =>
      api.put<Portfolio>(endpointsConfig.PORTFOLIOS.UPDATE(id), data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.portfolios.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.portfolios.lists() });
    },
  });
}

export function useDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(endpointsConfig.PORTFOLIOS.DELETE(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.portfolios.lists() }),
  });
}

export function usePortfolioAnalytics(id: string) {
  return useQuery({
    queryKey: queryKeys.portfolios.analytics(id),
    queryFn: () => api.get<PortfolioAnalytics>(endpointsConfig.PORTFOLIOS.ANALYTICS(id)),
    enabled: !!id,
    staleTime: 60000,
  });
}

export function usePortfolioPerformance(id: string) {
  return useQuery({
    queryKey: queryKeys.portfolios.performance(id),
    queryFn: () => api.get<PortfolioPerformancePoint[]>(endpointsConfig.PORTFOLIOS.PERFORMANCE(id)),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
