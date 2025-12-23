import React, { useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useOrganization } from '../contexts/OrganizationContext';

/**
 * A unified subscription guard component that handles both individual and business accounts.
 * 
 * For individual accounts:
 * - Redirects non-subscribed users to /pricing
 * 
 * For business accounts:
 * - Redirects users to org-specific pricing if their organization is not subscribed
 * - Redirects users on /pricing to /pricing?org={orgId} if they don't have an active subscription
 */
export default function SubscriptionGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: userLoading } = useUser();
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  // Skip during initial loading
  if (userLoading || orgLoading) {
    return null;
  }

  // Handle authentication-related pages separately
  const isAuthOrPricingPage = 
    location.pathname.includes('/pricing') ||
    location.pathname.includes('/auth') ||
    location.pathname.includes('/signin') ||
    location.pathname.includes('/signup') ||
    location.pathname.includes('/invite') ||
    location.pathname.includes('/accept-invite') ||
    location.pathname.includes('/organization-invitation');

  // For business accounts
  if (user?.accountType === 'business') {
    // If on /pricing without org parameter and not subscribed, redirect to org pricing
    if (
      currentOrg && 
      !currentOrg.isSubscribed && 
      location.pathname === '/pricing' && 
      !location.search.includes('org=')
    ) {
      return <Navigate to={`/pricing?org=${currentOrg.id}`} replace />;
    }
    
    // Check if business account's organization is subscribed for protected routes
    if (currentOrg && !currentOrg.isSubscribed && !isAuthOrPricingPage) {
      // Use Navigate component for immediate redirect instead of navigate function
      return (
        <Navigate 
          to={`/pricing?org=${currentOrg.id}`} 
          state={{ 
          from: location.pathname,
          message: 'Your organization requires a subscription to access this feature.'
          }}
          replace 
        />
      );
    }
    
    return children;
  }
  
  // For individual accounts (default if accountType is not set)
  if (user && (!user.accountType || user.accountType === 'individual') && !user.isSubscribed && !isAuthOrPricingPage) {
    // Use Navigate component for immediate redirect instead of navigate function
    return (
      <Navigate 
        to="/pricing" 
        state={{ 
        from: location.pathname,
        message: 'Please subscribe to access this feature.'
        }}
        replace 
      />
    );
  }

  return children;
}
