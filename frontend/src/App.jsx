import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CssBaseline from '@mui/material/CssBaseline';
import { UserProvider } from './contexts/UserContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { ThemeModeProvider } from './contexts/ThemeModeContext';
import SubscriptionGuard from './components/SubscriptionGuard';
import AppRoutes from './routes';

/* translations */
import './i18n';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ThemeModeProvider>
        <CssBaseline />
        <Router>
            <OrganizationProvider>
              <SubscriptionGuard>
                <AppRoutes />
              </SubscriptionGuard>
            </OrganizationProvider>
        </Router>
        </ThemeModeProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
