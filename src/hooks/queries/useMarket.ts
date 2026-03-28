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

export interface PriceHistoryPoint {
  date: string;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface IndexData {
  symbol: string;
  name: string;
  fullName: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  sparkline: number[];
}

export interface CompareData {
  asset1: { symbol: string; history: { date: string; value: number; price: number }[] };
  asset2: { symbol: string; history: { date: string; value: number; price: number }[] };
}

export function useStockPrice(symbol: string) {
  return useQuery({
    queryKey: queryKeys.market.stock(symbol),
    queryFn: () => api.get<StockPrice>(endpointsConfig.MARKET.STOCK(symbol)),
    enabled: !!symbol,
    refetchInterval: 60000,
    retry: 1,
  });
}

export function useCryptoPrice(id: string) {
  return useQuery({
    queryKey: queryKeys.market.crypto(id),
    queryFn: () => api.get<CryptoPrice>(endpointsConfig.MARKET.CRYPTO(id)),
    enabled: !!id,
    refetchInterval: 60000,
    retry: 1,
  });
}

export function useMarketSearch(query: string, type: string = 'stock') {
  return useQuery({
    queryKey: queryKeys.market.search(query, type),
    queryFn: () => api.get<SearchResult[]>(`${endpointsConfig.MARKET.SEARCH}?q=${query}&type=${type}`),
    enabled: query.length >= 2,
  });
}

export function usePriceHistory(symbol: string, range: string = '1m') {
  return useQuery({
    queryKey: [...queryKeys.market.all, 'history', symbol, range],
    queryFn: () => api.get<PriceHistoryPoint[]>(endpointsConfig.MARKET.HISTORY(symbol, range)),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });
}

export function useIndices() {
  return useQuery({
    queryKey: [...queryKeys.market.all, 'indices'],
    queryFn: () => api.get<IndexData[]>(endpointsConfig.MARKET.INDICES),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useCompare(symbol1: string, symbol2: string, range: string = '1m') {
  return useQuery({
    queryKey: [...queryKeys.market.all, 'compare', symbol1, symbol2, range],
    queryFn: () => api.get<CompareData>(endpointsConfig.MARKET.COMPARE(symbol1, symbol2, range)),
    enabled: !!symbol1 && !!symbol2,
    staleTime: 5 * 60 * 1000,
  });
}
