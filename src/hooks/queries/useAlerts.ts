import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { queryKeys } from '@/lib/queryKeys';
import { endpointsConfig } from '@/config/endpointsConfig';

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
    queryFn: () => api.get<Alert[]>(endpointsConfig.ALERTS.LIST),
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAlertPayload) =>
      api.post<Alert, CreateAlertPayload>(endpointsConfig.ALERTS.CREATE, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts.lists() }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(endpointsConfig.ALERTS.DELETE(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts.lists() }),
  });
}
