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
  },

  TRANSACTIONS: {
    LIST_ALL: `${API}/transactions`,
    LIST: (assetId: string) => `${API}/assets/${assetId}/transactions`,
    CREATE: (assetId: string) => `${API}/assets/${assetId}/transactions`,
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
