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

export interface StockFundamentals {
  currentPrice: number;
  marketCap: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  peRatio: number | null;
  forwardPE: number | null;
  pbRatio: number | null;
  eps: number | null;
  bookValue: number | null;
  roe: number | null;
  debtToEquity: number | null;
  revenueGrowth: number | null;
  profitGrowth: number | null;
  dividendYield: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  operatingMargins: number | null;
  profitMargins: number | null;
  grossMargins: number | null;
  revenuePerShare: number | null;
  targetMeanPrice: number | null;
  recommendationKey: string | null;
  numberOfAnalystOpinions: number | null;
  distanceFrom52WeekHigh: number;
  distanceFrom52WeekLow: number;
  sector: string | null;
}

export interface CryptoDetails {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number | null;
  totalVolume: number;
  change24h: number;
  change7d: number;
  change30d: number;
  change1y: number;
  ath: number;
  athDate: string | null;
  atl: number;
  atlDate: string | null;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  high24h: number;
  low24h: number;
}

export interface ScreenerStock {
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  peRatio: number | null;
  roe: number | null;
  revenueGrowth: number | null;
  profitGrowth: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  distanceFrom52WeekLow: number;
  distanceFrom52WeekHigh: number;
}

export interface ScreenerResult {
  stocks: ScreenerStock[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UndervaluedStock extends ScreenerStock {
  scores: {
    peScore: number;
    growthScore: number;
    debtScore: number;
    roeScore: number;
    lowScore: number;
    totalScore: number;
  };
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

export function useStockFundamentals(symbol: string) {
  return useQuery({
    queryKey: queryKeys.market.stockFundamentals(symbol),
    queryFn: () => api.get<StockFundamentals>(endpointsConfig.MARKET.STOCK_FUNDAMENTALS(symbol)),
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useCryptoDetails(id: string) {
  return useQuery({
    queryKey: queryKeys.market.cryptoDetails(id),
    queryFn: () => api.get<CryptoDetails>(endpointsConfig.MARKET.CRYPTO_DETAILS(id)),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useScreener(filters: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const queryString = params.toString();

  return useQuery({
    queryKey: queryKeys.market.screener(filters),
    queryFn: () => api.get<ScreenerResult>(`${endpointsConfig.MARKET.SCREENER}?${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUndervaluedStocks() {
  return useQuery({
    queryKey: queryKeys.market.undervalued(),
    queryFn: () => api.get<UndervaluedStock[]>(endpointsConfig.MARKET.UNDERVALUED),
    staleTime: 10 * 60 * 1000,
  });
}
