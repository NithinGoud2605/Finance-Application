import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';

export const useSubscriptionQuery = (userId) => {
  return useQuery({
    queryKey: ['subscription', userId],
    queryFn: () => apiRequest('get', '/subscription/status'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    onError: (error) => {
      if (error.response?.status === 429) {
        // Implement exponential backoff
        return new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  });
};