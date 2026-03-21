import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      const status = (error as { status?: number })?.status;
      if (status && [401, 403, 404].includes(status)) return false;
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: 0,
  },
};

export const queryClient = new QueryClient({ defaultOptions });
