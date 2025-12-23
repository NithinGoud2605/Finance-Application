import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import InvoicesPage from '../components/Invoicecomp/InvoicesPage';
import CreateInvoicePage from '../components/Invoicecomp/CreateInvoice/index';
import { SignatureProvider } from '../components/Invoicecomp/CreateInvoice/contexts/SignatureContext';

const InvoiceRoutes = () => {
  return (
    <Routes>
      <Route index element={<InvoicesPage />} />
      <Route 
        path="create" 
        element={
          <SignatureProvider>
            <CreateInvoicePage />
          </SignatureProvider>
        } 
      />
      <Route 
        path="edit/:id" 
        element={
          <SignatureProvider>
            <CreateInvoicePage />
          </SignatureProvider>
        } 
      />
      <Route path="*" element={<Navigate to="/invoices" replace />} />
    </Routes>
  );
};

export default InvoiceRoutes;