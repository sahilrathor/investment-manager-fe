import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { queryKeys } from '@/lib/queryKeys';
import { endpointsConfig } from '@/config/endpointsConfig';

export interface Sip {
  id: string;
  assetId: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  nextPaymentDate: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  assetName: string;
  assetSymbol: string;
  assetType: string;
}

export interface CreateSipPayload {
  assetId: string;
  amount: number;
  frequency: string;
  startDate: string;
}

export function useSips() {
  return useQuery({
    queryKey: queryKeys.sips.lists(),
    queryFn: () => api.get<Sip[]>(endpointsConfig.SIPS.LIST),
  });
}

export function useCreateSip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSipPayload) =>
      api.post<Sip, CreateSipPayload>(endpointsConfig.SIPS.CREATE, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sips.lists() }),
  });
}

export function useUpdateSip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSipPayload> & { status?: string } }) =>
      api.put<Sip>(endpointsConfig.SIPS.UPDATE(id), data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sips.lists() }),
  });
}

export function useDeleteSip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(endpointsConfig.SIPS.DELETE(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sips.lists() }),
  });
}
