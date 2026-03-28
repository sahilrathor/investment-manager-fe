import { envConfig } from './envConfig';

const API = envConfig.API_BASE_URL;

export const endpointsConfig = {
  AUTH: {
    LOGIN: `${API}/auth/login`,
    REGISTER: `${API}/auth/register`,
    REFRESH: `${API}/auth/refresh`,
    LOGOUT: `${API}/auth/logout`,
    ME: `${API}/auth/me`,
  },

  PORTFOLIOS: {
    LIST: `${API}/portfolios`,
    CREATE: `${API}/portfolios`,
    GET: (id: string) => `${API}/portfolios/${id}`,
    UPDATE: (id: string) => `${API}/portfolios/${id}`,
    DELETE: (id: string) => `${API}/portfolios/${id}`,
  },

  ASSETS: {
    LIST_ALL: `${API}/assets`,
    LIST: (portfolioId: string) => `${API}/portfolios/${portfolioId}/assets`,
    CREATE: (portfolioId: string) => `${API}/portfolios/${portfolioId}/assets`,
    GET: (id: string) => `${API}/assets/${id}`,
    DETAIL: (id: string) => `${API}/assets/${id}/detail`,
    NEWS: (id: string) => `${API}/assets/${id}/news`,
    EVENTS: (id: string) => `${API}/assets/${id}/events`,
    UPDATE: (id: string) => `${API}/assets/${id}`,
    DELETE: (id: string) => `${API}/assets/${id}`,
    MOVE: (id: string) => `${API}/assets/${id}/move`,
  },

  TRANSACTIONS: {
    LIST_ALL: `${API}/transactions`,
    LIST: (assetId: string) => `${API}/assets/${assetId}/transactions`,
    CREATE: (assetId: string) => `${API}/assets/${assetId}/transactions`,
    UPDATE: (id: string) => `${API}/transactions/${id}`,
    DELETE: (id: string) => `${API}/transactions/${id}`,
  },

  SIPS: {
    LIST: `${API}/sips`,
    CREATE: `${API}/sips`,
    UPDATE: (id: string) => `${API}/sips/${id}`,
    DELETE: (id: string) => `${API}/sips/${id}`,
  },

  ALERTS: {
    LIST: `${API}/alerts`,
    CREATE: `${API}/alerts`,
    DELETE: (id: string) => `${API}/alerts/${id}`,
  },

  MARKET: {
    STOCK: (symbol: string) => `${API}/market/stock/${symbol}`,
    CRYPTO: (id: string) => `${API}/market/crypto/${id}`,
    HISTORY: (symbol: string, range?: string) => `${API}/market/history/${symbol}?range=${range || '1m'}`,
    INDICES: `${API}/market/indices`,
    COMPARE: (s1: string, s2: string, range?: string) => `${API}/market/compare?symbol1=${s1}&symbol2=${s2}&range=${range || '1m'}`,
    EXCHANGE_RATE: `${API}/market/exchange-rate`,
    SEARCH: `${API}/market/search`,
  },

  DATA: {
    IMPORT: `${API}/import/csv`,
    EXPORT: (type: string) => `${API}/export/csv?type=${type}`,
  },

  TELEGRAM: {
    LINK: `${API}/telegram/link`,
    UNLINK: `${API}/telegram/unlink`,
  },
} as const;
