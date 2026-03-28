import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { queryKeys } from '@/lib/queryKeys';
import { endpointsConfig } from '@/config/endpointsConfig';

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

export interface CryptoPrice {
  id: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

export interface SearchResult {
  id?: string;
  symbol: string;
  name: string;
  type: string;
}

export function useStockPrice(symbol: string) {
  return useQuery({
    queryKey: queryKeys.market.stock(symbol),
    queryFn: () => api.get<StockPrice>(endpointsConfig.MARKET.STOCK(symbol)),
    enabled: !!symbol,
    refetchInterval: 30000,
  });
}

export function useCryptoPrice(id: string) {
  return useQuery({
    queryKey: queryKeys.market.crypto(id),
    queryFn: () => api.get<CryptoPrice>(endpointsConfig.MARKET.CRYPTO(id)),
    enabled: !!id,
    refetchInterval: 30000,
  });
}

export function useMarketSearch(query: string, type: string = 'stock') {
  return useQuery({
    queryKey: queryKeys.market.search(query, type),
    queryFn: () => api.get<SearchResult[]>(`${endpointsConfig.MARKET.SEARCH}?q=${query}&type=${type}`),
    enabled: query.length >= 2,
  });
}
