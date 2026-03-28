export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  portfolios: {
    all: ['portfolios'] as const,
    lists: () => [...queryKeys.portfolios.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.portfolios.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.portfolios.all, 'detail', id] as const,
  },
  assets: {
    all: ['assets'] as const,
    lists: () => [...queryKeys.assets.all, 'list'] as const,
    listAll: () => [...queryKeys.assets.lists(), 'all'] as const,
    list: (portfolioId: string) => [...queryKeys.assets.lists(), portfolioId] as const,
    detail: (id: string) => [...queryKeys.assets.all, 'detail', id] as const,
    news: (id: string) => [...queryKeys.assets.all, 'news', id] as const,
    events: (id: string) => [...queryKeys.assets.all, 'events', id] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    listAll: () => [...queryKeys.transactions.lists(), 'all'] as const,
    list: (assetId: string) => [...queryKeys.transactions.lists(), assetId] as const,
  },
  sips: {
    all: ['sips'] as const,
    lists: () => [...queryKeys.sips.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.sips.all, 'detail', id] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    lists: () => [...queryKeys.alerts.all, 'list'] as const,
  },
  market: {
    all: ['market'] as const,
    stock: (symbol: string) => [...queryKeys.market.all, 'stock', symbol] as const,
    crypto: (id: string) => [...queryKeys.market.all, 'crypto', id] as const,
    search: (q: string, type: string) => [...queryKeys.market.all, 'search', q, type] as const,
  },
} as const;
