import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Box } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import DashboardLayout from './components/Dashcomp/DashboardLayout';
import MainLayout from './components/layouts/MainLayout';
import PrivateRoute from './PrivateRoute';
import PageTransition from './components/transitions/PageTransition';
import LoadingSkeleton from './components/common/LoadingSkeleton';

/* Lazy-loaded pages */
const LandingPage = lazy(() => import('./pages/LandingPage'));
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const AcceptInvitePageWithParams = lazy(() => import('./pages/organization/AcceptInvitation'));
const AcceptInvitePage = lazy(() => import('./pages/AcceptInvitePage'));
const PublicInvoiceView = lazy(() => import('./pages/PublicInvoiceView'));
const PublicContractView = lazy(() => import('./pages/PublicContractView'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyAccount = lazy(() => import('./pages/MyAccount'));
const InvoiceRoutes = lazy(() => import('./pages/InvoiceRoutes'));
const ContractRoutes = lazy(() => import('./pages/ContractRoutes'));
const ClientRoutes = lazy(() => import('./pages/ClientRoutes'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ApiKeys = lazy(() => import('./pages/ApiKeys'));
const ExpenseRoutes = lazy(() => import('./pages/ExpenseRoutes'));
const ProjectRoutes = lazy(() => import('./pages/ProjectRoutes'));
const OrganizationRoutes = lazy(() => import('./pages/OrganizationRoutes'));
const Pricing = lazy(() => import('./pages/Pricing'));
const AnalyticsDashboard = lazy(() => import('./components/Analyticscomp/AnalyticsDashboard'));

const LoadingFallback = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      width: '100%',
    }}
  >
    <LoadingSkeleton type="page" />
  </Box>
);

const AppRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location} key={location.pathname}>
        {/* ─── PUBLIC ─────────────────────────────────────────── */}
          <Route 
            path="/" 
            element={
              <PageTransition>
                <LandingPage />
              </PageTransition>
            } 
          />
          <Route 
            path="/sign-in" 
            element={
              <PageTransition>
                <SignIn />
              </PageTransition>
            } 
          />
          <Route 
            path="/sign-up" 
            element={
              <PageTransition>
                <SignUp />
              </PageTransition>
            } 
          />
          <Route 
            path="/auth/callback" 
            element={
              <PageTransition>
                <AuthCallback />
              </PageTransition>
            } 
          />
          <Route 
            path="/accept-invite" 
            element={
              <PageTransition>
                <AcceptInvitePage />
              </PageTransition>
            } 
          />
          <Route 
            path="/accept-invite/:token" 
            element={
              <PageTransition>
                <AcceptInvitePageWithParams />
              </PageTransition>
            } 
          />
          <Route 
            path="/pricing" 
            element={
              <PageTransition>
                <Pricing />
              </PageTransition>
            } 
          />
          <Route 
            path="/public/invoice/:token" 
            element={
              <PageTransition>
                <PublicInvoiceView />
              </PageTransition>
            } 
          />
          <Route 
            path="/public/contract/:token" 
            element={
              <PageTransition>
                <PublicContractView />
              </PageTransition>
            } 
          />

        {/* ─── PROTECTED ─────────────────────────────────────── */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
              <Route 
                path="/dashboard/*" 
                element={
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                } 
              />
              <Route 
                path="/my-account" 
                element={
                  <PageTransition>
                    <MyAccount />
                  </PageTransition>
                } 
              />
              <Route 
                path="/invoices/*" 
                element={
                  <PageTransition>
                    <InvoiceRoutes />
                  </PageTransition>
                } 
              />
              <Route 
                path="/contracts/*" 
                element={
                  <PageTransition>
                    <ContractRoutes />
                  </PageTransition>
                } 
              />
              <Route 
                path="/clients/*" 
                element={
                  <PageTransition>
                    <ClientRoutes />
                  </PageTransition>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <PageTransition>
                    <AnalyticsDashboard />
                  </PageTransition>
                } 
              />
              <Route 
                path="/api-keys" 
                element={
                  <PageTransition>
                    <ApiKeys />
                  </PageTransition>
                } 
              />
              <Route 
                path="/expenses/*" 
                element={
                  <PageTransition>
                    <ExpenseRoutes />
                  </PageTransition>
                } 
              />
              <Route 
                path="/projects/*" 
                element={
                  <PageTransition>
                    <ProjectRoutes />
                  </PageTransition>
                } 
              />
            
            {/* All organisation pages */}
              <Route 
                path="/organization/*" 
                element={
                  <PageTransition>
                    <OrganizationRoutes />
                  </PageTransition>
                } 
              />
          </Route>
        </Route>

        {/* ─── FALLBACK ──────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    </AnimatePresence>
  );
};

export default AppRoutes; 