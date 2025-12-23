/**
 * Utility functions for handling payments
 */

/**
 * Handle successful payment by reloading user and organization contexts
 * then reloading the page to ensure all components are updated
 * 
 * @param {Object} options Configuration options
 * @param {Function} options.refreshUser Function to refresh user context
 * @param {Function} options.refreshOrganizations Function to refresh organizations
 * @param {boolean} options.hardReload Whether to perform a hard page reload (default: true)
 * @param {Function} options.onSuccess Optional callback after contexts are refreshed
 * @returns {Promise<void>}
 */
export const handlePaymentSuccess = async ({ 
  refreshUser, 
  refreshOrganizations, 
  hardReload = true,
  onSuccess
}) => {
  try {
    console.log('Payment successful, refreshing data...');
    
    // Set a flag to force data refresh after page reload
    localStorage.setItem('forceDataRefresh', 'true');
    localStorage.setItem('refreshTimestamp', Date.now().toString());
    
    // Immediately mark as subscribed in localStorage to prevent flicker
    const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
    cachedUser.isSubscribed = true;
    localStorage.setItem('cachedUser', JSON.stringify(cachedUser));
    localStorage.setItem('isSubscribed', 'true');
    
    // Load user context first with retry mechanism
    if (refreshUser) {
      let retryCount = 0;
      let userData = null;
      
      while (retryCount < 2 && (!userData || userData.isSubscribed !== true)) {
        try {
          userData = await refreshUser(false);
          console.log('User context refreshed:', userData);
          
          // Ensure localStorage was updated with isSubscribed value
          if (userData && userData.isSubscribed !== undefined) {
            localStorage.setItem('isSubscribed', userData.isSubscribed.toString());
            localStorage.setItem('cachedUser', JSON.stringify(userData));
          }
          
          // If subscription still not active, wait and retry
          if (!userData.isSubscribed) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            retryCount++;
          }
        } catch (err) {
          console.error('Error refreshing user data:', err);
          await new Promise(resolve => setTimeout(resolve, 3000));
          retryCount++;
        }
      }
    }
    
    // Then load organization context if account type is business
    const accountType = localStorage.getItem('accountType');
    if (accountType === 'business' && refreshOrganizations) {
      let retryCount = 0;
      let orgData = null;
      
      while (retryCount < 3 && !orgData) {
        try {
          orgData = await refreshOrganizations();
          console.log('Organization context refreshed:', orgData);
          
          // Ensure current org subscription status is updated in localStorage
          if (orgData && orgData.currentOrg && orgData.currentOrg.isSubscribed !== undefined) {
            // We need to update the organization in the cached organizations array
            const organizations = JSON.parse(localStorage.getItem('organizations') || '[]');
            const orgIndex = organizations.findIndex(org => org.id === orgData.currentOrg.id);
            
            if (orgIndex >= 0) {
              organizations[orgIndex] = {
                ...organizations[orgIndex],
                isSubscribed: orgData.currentOrg.isSubscribed
              };
              localStorage.setItem('organizations', JSON.stringify(organizations));
            }
          }
        } catch (err) {
          console.error('Error refreshing organization data:', err);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retryCount++;
        }
      }
    }
    
    // Execute success callback if provided
    if (typeof onSuccess === 'function') {
      onSuccess();
    }
    
    // Add a small delay to ensure localStorage updates are complete
    if (hardReload) {
      console.log('Performing hard reload...');
      // Add a small delay to ensure localStorage updates are processed
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}; 