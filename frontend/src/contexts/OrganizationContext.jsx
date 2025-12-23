import React, {
  createContext, useContext, useState, useEffect, useCallback, useMemo
} from 'react';
import {
  getUserOrganizations,
  getOrganization,
  createOrganization          // for addOrganization helper
} from '../services/organizationService';
import { useUser } from '../hooks/useUser';
import { UserContext } from './UserContext';

// Simple logger for frontend
const logger = {
  info: (message, data) => console.log('🔵 [OrganizationContext]', message, data),
  warn: (message, data) => console.warn('🟡 [OrganizationContext]', message, data),
  error: (message, data) => console.error('🔴 [OrganizationContext]', message, data)
};

const OrganizationContext = createContext();

export function OrganizationProvider({ children }) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const { user } = useContext(UserContext);
  const accountType = localStorage.getItem('accountType');

  // Initialize organizations (optimized to not block initial render)
  useEffect(() => {
    // For business accounts, automatically select their default organization
    // No organization switching allowed for business accounts
    if (accountType === 'business' && user) {
      // Defer the organization loading to not block initial render
      setTimeout(async () => {
        try {
          setLoading(true);
          setError(null);
          
          const orgs = await getUserOrganizations();
          
          if (orgs && orgs.length > 0) {
            // Business accounts should only have one organization
            const userOrg = orgs[0];
            setOrganizations(orgs);
            
            // Automatically select the first (and only) organization
            setSelectedOrg(userOrg);
            setUserRole(userOrg.role || 'MEMBER');
            
            // Check subscription status and activation needs
            const needsActivation = !userOrg.isSubscribed && userOrg.role === 'OWNER';
            const canManageSubscription = userOrg.role === 'OWNER';
            
            setSubscriptionStatus({
              isSubscribed: userOrg.isSubscribed || false,
              needsActivation: needsActivation,
              canManageSubscription: canManageSubscription,
              userRole: userOrg.role,
              hasActiveSubscription: !!userOrg.isSubscribed,
              subscriptionDetails: null
            });
            
            if (userOrg.id) {
              localStorage.setItem('lastSelectedOrgId', userOrg.id);
            }
            
            logger.info('Business account auto-selected organization:', {
              orgId: userOrg.id,
              orgName: userOrg.name,
              role: userOrg.role,
              isSubscribed: userOrg.isSubscribed,
              needsActivation: needsActivation,
              canManageSubscription: canManageSubscription
            });

            // Show appropriate feedback for activation needs
            if (needsActivation) {
              logger.warn('Organization requires activation', {
                orgId: userOrg.id,
                userRole: userOrg.role,
                message: 'Owner can activate subscription'
              });
            } else if (!userOrg.isSubscribed && userOrg.role !== 'OWNER') {
              logger.info('Organization not subscribed, user cannot manage', {
                orgId: userOrg.id,
                userRole: userOrg.role,
                message: 'Only owners can manage subscription'
              });
            }
          } else {
            logger.warn('Business account has no organizations');
            setOrganizations([]);
            setSelectedOrg(null);
            setUserRole(null);
            setSubscriptionStatus(null);
          }
        } catch (err) {
          logger.error('Failed to load business account organization:', err);
          setError(err?.message || 'Failed to load organization');
        } finally {
          setLoading(false);
        }
      }, 0);
    } else if (accountType === 'individual') {
      // Individual accounts don't need organizations
      setOrganizations([]);
      setSelectedOrg(null);
      setUserRole(null);
      setSubscriptionStatus(null);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [accountType, user]);

  /* ───────────────────── safe fetch ───────────────────── */
  const safeGetOrg = async (orgId) => {
    try {
      const orgData = await getOrganization(orgId);
      return orgData;
    } catch (err) {
      console.warn('[OrgCtx] removing stale orgId', orgId, err?.response?.status);
      return null;
    }
  };

  /* ───────────────────── refresh org ───────────────────── */
  const refreshOrg = useCallback(async () => {
    if (!selectedOrg?.id) return;
    
    try {
      setLoading(true);
      const orgData = await safeGetOrg(selectedOrg.id);
      
      if (orgData) {
        // Find the role from the cached organizations list
        const membership = organizations.find(o => o.id === orgData.id);
        const role = membership?.role || userRole || 'MEMBER';
        
        const orgWithRole = { ...orgData, role };
        setSelectedOrg(orgWithRole);
        setUserRole(role);
        
        // Update subscription status
        const needsActivation = !orgData.isSubscribed && role === 'OWNER';
        const canManageSubscription = role === 'OWNER';
        
        setSubscriptionStatus({
          isSubscribed: orgData.isSubscribed,
          needsActivation: needsActivation,
          canManageSubscription: canManageSubscription,
          userRole: role,
          hasActiveSubscription: !!orgData.isSubscribed,
          subscriptionDetails: null
        });
        
        logger.info('Organization refreshed:', {
          orgId: orgData.id,
          isSubscribed: orgData.isSubscribed,
          needsActivation: needsActivation,
          userRole: role
        });
      }
    } catch (error) {
      logger.error('Failed to refresh organization:', error);
      setError(error?.message || 'Failed to refresh organization');
    } finally {
      setLoading(false);
    }
  }, [selectedOrg?.id, organizations, userRole]);

  /* ───────────────────── switch‑org (disabled for business accounts) ───────────────────── */
  const switchOrganization = useCallback(async (orgId) => {
    // Business accounts cannot switch organizations
    if (accountType === 'business') {
      logger.warn('Organization switching disabled for business accounts');
      return;
    }

    try {
      setLoading(true);

      const orgRow = await safeGetOrg(orgId);
      if (!orgRow) {
        setSelectedOrg(null);
        setUserRole(null);
        setSubscriptionStatus(null);
        localStorage.removeItem('lastSelectedOrgId');
        return;
      }

      /* look up my membership in the cached list – this gives the role */
      const membership = organizations.find(o => o.id === orgRow.id);
      const role       = membership?.role || 'MEMBER';

      const orgWithRole = { ...orgRow, role };
      setSelectedOrg(orgWithRole);
      setUserRole(role);
      
      // Update subscription status for the selected org
      const needsActivation = !orgRow.isSubscribed && role === 'OWNER';
      const canManageSubscription = role === 'OWNER';
      
      setSubscriptionStatus({
        isSubscribed: orgRow.isSubscribed || false,
        needsActivation: needsActivation,
        canManageSubscription: canManageSubscription,
        userRole: role,
        hasActiveSubscription: !!orgRow.isSubscribed,
        subscriptionDetails: null
      });
      
      if (orgRow?.id) localStorage.setItem('lastSelectedOrgId', orgRow.id);
    } finally {
      setLoading(false);
    }
  }, [organizations, accountType]);

  /* ───────────────────── create‑and‑select helper (disabled for business accounts) ───────────────────── */
  const addOrganization = async (data) => {
    // Business accounts cannot create additional organizations
    if (accountType === 'business') {
      throw new Error('Business accounts can only have one organization');
    }

    if (organizations.length) throw new Error('You already have an organisation');

    const newOrg = await createOrganization(data);          // API returns org row
    const orgWithRole = { ...newOrg, role: 'OWNER' };

    setOrganizations([orgWithRole]);
    setUserRole('OWNER');
    
    // Set initial subscription status for new org
    setSubscriptionStatus({
      isSubscribed: false,
      needsActivation: true, // New orgs need activation
      canManageSubscription: true, // Creator is owner
      userRole: 'OWNER',
      hasActiveSubscription: false,
      subscriptionDetails: null
    });
    
    await switchOrganization(orgWithRole.id);
    return orgWithRole;
  };

  // Helper to check if user can manage organization subscriptions
  const canManageSubscription = () => {
    if (accountType === 'individual') return true;
    return selectedOrg && userRole === 'OWNER';
  };

  // Helper to check if organization switching is allowed
  const canSwitchOrganization = () => {
    return accountType !== 'business';
  };

  // Helper to get subscription activation message
  const getSubscriptionMessage = () => {
    if (!selectedOrg || accountType !== 'business') return null;
    
    if (!selectedOrg.isSubscribed) {
      if (userRole === 'OWNER') {
        return 'Your organization requires activation. Please complete the payment process to access premium features.';
      } else {
        return 'Your organization is not subscribed. Please contact the organization owner to activate subscription.';
      }
    }
    
    return null;
  };

  /* ───────────────────── exposed ctx ───────────────────── */
  const contextValue = useMemo(() => ({
    organizations,
    selectedOrg,
    currentOrg: selectedOrg,        // alias
    userRole,
    loading,
    error,
    subscriptionStatus,
    
    // Actions (some disabled for business accounts)
    switchOrganization: canSwitchOrganization() ? switchOrganization : () => {},
    addOrganization: canSwitchOrganization() ? addOrganization : () => { throw new Error('Business accounts cannot create additional organizations'); },
    
    // Helpers
    refreshOrgs: () => window.location.reload(),
    refreshOrg: refreshOrg,
    canManageSubscription,
    canSwitchOrganization,
    getSubscriptionMessage,
    
    // Business account info
    isBusinessAccount: accountType === 'business',
    isLimitedToOneOrg: accountType === 'business',
    
    // Subscription status helpers
    needsActivation: subscriptionStatus?.needsActivation || false,
    hasActiveSubscription: subscriptionStatus?.hasActiveSubscription || false
  }), [
    organizations,
    selectedOrg,
    userRole,
    loading,
    error,
    subscriptionStatus,
    switchOrganization,
    addOrganization,
    refreshOrg,
    accountType
  ]);

  return (
    <OrganizationContext.Provider
      value={contextValue}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganization = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used inside OrganizationProvider');
  return ctx;
};
