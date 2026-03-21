import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { queryKeys } from '@/lib/queryKeys';

export interface Alert {
  id: string;
  assetId: string;
  targetPrice: number;
  direction: 'above' | 'below';
  isTriggered: boolean;
  createdAt: string;
  assetName: string;
  assetSymbol: string;
  assetType: string;
  currentPrice: number;
}

export interface CreateAlertPayload {
  assetId: string;
  targetPrice: number;
  direction: 'above' | 'below';
}

export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts.lists(),
    queryFn: () => api.get<Alert[]>('/alerts'),
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAlertPayload) =>
      api.post<Alert, CreateAlertPayload>('/alerts', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts.lists() }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts.lists() }),
  });
}
