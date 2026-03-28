import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/apiService';
import { endpointsConfig } from '@/config/endpointsConfig';

const INR_SYMBOL = '₹';
const USD_SYMBOL = '$';

// Asset types that are in INR (Indian market)
const INR_TYPES = ['stock', 'mutual_fund', 'sip'];

// Asset types that are in USD (international)
const USD_TYPES = ['crypto'];

export function isINRAsset(assetType: string): boolean {
  return INR_TYPES.includes(assetType);
}

export function isUSDAsset(assetType: string): boolean {
  return USD_TYPES.includes(assetType);
}

export function getCurrencySymbol(assetType: string): string {
  return isUSDAsset(assetType) ? USD_SYMBOL : INR_SYMBOL;
}

// Format currency with appropriate symbol
export function formatCurrency(amount: number, assetType?: string): string {
  const symbol = assetType ? getCurrencySymbol(assetType) : INR_SYMBOL;
  return `${symbol}${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// Format INR
export function formatINR(amount: number): string {
  return `${INR_SYMBOL}${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// Format USD
export function formatUSD(amount: number): string {
  return `${USD_SYMBOL}${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

// Format compact (for large numbers)
export function formatCompactINR(amount: number): string {
  if (amount >= 10000000) return `${INR_SYMBOL}${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `${INR_SYMBOL}${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `${INR_SYMBOL}${(amount / 1000).toFixed(1)}K`;
  return formatINR(amount);
}

// Hook to get exchange rate
export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchange-rate'],
    queryFn: () => api.get<{ from: string; to: string; rate: number; timestamp: string }>(endpointsConfig.MARKET.EXCHANGE_RATE),
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 60 * 60 * 1000, // 1 hour
    retry: 2,
  });
}

// Convert USD to INR
export function usdToINR(usdAmount: number, rate: number): number {
  return usdAmount * rate;
}

// Convert INR to USD
export function inrToUSD(inrAmount: number, rate: number): number {
  return inrAmount / rate;
}
