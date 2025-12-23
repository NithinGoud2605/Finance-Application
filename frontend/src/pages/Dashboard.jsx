// src/pages/Dashboard.jsx
import React, { useEffect } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";
import DashboardHome from "../components/Dashcomp/DashboardHome";
import InvoiceRoutes from "./InvoiceRoutes";
import ContractRoutes from "./ContractRoutes";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useUser } from "../hooks/useUser";
import { useOrganization } from "../contexts/OrganizationContext";
import { handlePaymentSuccess } from "../utils/paymentUtils.jsx";

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useUser();
  const { refreshOrganizations } = useOrganization();
  
  // Check for session_id in URL which indicates a successful payment
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      console.log('Payment session detected:', sessionId);
      
      // First manually mark as subscribed in localStorage to prevent flicker
      const cachedUser = JSON.parse(localStorage.getItem('cachedUser') || '{}');
      cachedUser.isSubscribed = true;
      localStorage.setItem('cachedUser', JSON.stringify(cachedUser));
      localStorage.setItem('isSubscribed', 'true');
      
      // Then properly refresh all data with retry mechanism (background only)
      const refreshData = async () => {
        let retryCount = 0;
        let success = false;
        
        while (retryCount < 3 && !success) {
          try {
            // Silent background refresh after payment
            const userData = await refreshUser(false); // Don't show loading
            console.log('User data refreshed after payment:', userData);
            
            // Refresh organization data if needed (also silent)
            if (cachedUser.accountType === 'business') {
              const orgData = await refreshOrganizations();
              console.log('Organization data refreshed after payment:', orgData);
            }
            
            success = true;
          } catch (err) {
            console.error('Error refreshing data after payment:', err);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Longer wait between retries
            retryCount++;
          }
        }
        
        // Clean up the URL by removing the session_id parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
        // Only reload if absolutely necessary
        if (success) {
          // Force a single refresh to ensure all components are updated
          window.location.reload();
        }
      };
      
      // Delay the data refresh to avoid immediate API calls
      setTimeout(refreshData, 3000);
    }
  }, [searchParams, refreshUser, refreshOrganizations]);
  
  return (
    <>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="invoices/*" element={<InvoiceRoutes />} />
        <Route path="contracts/*" element={<ContractRoutes />} />
      </Routes>
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
