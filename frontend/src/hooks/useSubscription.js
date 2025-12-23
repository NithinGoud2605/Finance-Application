import { useQuery } from 'react-query';
import { getSubscriptionStatus } from '../services/api';

export const useSubscription = () => {
  return useQuery(
    'subscription', 
    getSubscriptionStatus,
    {
      staleTime: 5 * 60 * 1000, // Match backend cache time
      cacheTime: 10 * 60 * 1000
    }
  );
};