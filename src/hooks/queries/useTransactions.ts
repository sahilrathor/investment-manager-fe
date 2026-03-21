import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { queryKeys } from '@/lib/queryKeys';

export interface Transaction {
  id: string;
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  date: string;
  notes: string | null;
  createdAt: string;
  assetName?: string;
  assetSymbol?: string;
  assetType?: string;
}

export interface CreateTransactionPayload {
  type: 'buy' | 'sell';
  quantity: number;
  pricePerUnit: number;
  date: string;
  notes?: string;
}

export function useAllTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions.listAll(),
    queryFn: () => api.get<Transaction[]>('/transactions'),
  });
}

export function useAssetTransactions(assetId: string) {
  return useQuery({
    queryKey: queryKeys.transactions.list(assetId),
    queryFn: () => api.get<Transaction[]>(`/assets/${assetId}/transactions`),
    enabled: !!assetId,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, payload }: { assetId: string; payload: CreateTransactionPayload }) =>
      api.post<Transaction, CreateTransactionPayload>(`/assets/${assetId}/transactions`, payload),
    onSuccess: (_, { assetId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions.list(assetId) });
      qc.invalidateQueries({ queryKey: queryKeys.transactions.listAll() });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}
