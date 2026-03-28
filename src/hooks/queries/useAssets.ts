import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { queryKeys } from '@/lib/queryKeys';
import { endpointsConfig } from '@/config/endpointsConfig';

export interface Asset {
  id: string;
  portfolioId: string;
  type: 'stock' | 'crypto' | 'mutual_fund' | 'sip';
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  manualPrice: number | null;
  useLivePrice: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetPayload {
  type: string;
  symbol: string;
  name: string;
  quantity?: number;
  avgBuyPrice?: number;
  currentPrice?: number;
  manualPrice?: number;
  useLivePrice?: boolean;
}

export function useAssets(portfolioId: string) {
  return useQuery({
    queryKey: queryKeys.assets.list(portfolioId),
    queryFn: () => api.get<Asset[]>(endpointsConfig.ASSETS.LIST(portfolioId)),
    enabled: !!portfolioId,
  });
}

export function useAllAssets() {
  return useQuery({
    queryKey: queryKeys.assets.listAll(),
    queryFn: () => api.get<Asset[]>(endpointsConfig.ASSETS.LIST_ALL),
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: queryKeys.assets.detail(id),
    queryFn: () => api.get<Asset>(endpointsConfig.ASSETS.GET(id)),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ portfolioId, payload }: { portfolioId: string; payload: CreateAssetPayload }) =>
      api.post<Asset, CreateAssetPayload>(endpointsConfig.ASSETS.CREATE(portfolioId), payload),
    onSuccess: (_, { portfolioId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.assets.list(portfolioId) }),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAssetPayload> }) =>
      api.put<Asset>(endpointsConfig.ASSETS.UPDATE(id), data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.assets.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.assets.all });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(endpointsConfig.ASSETS.DELETE(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.assets.all }),
  });
}
