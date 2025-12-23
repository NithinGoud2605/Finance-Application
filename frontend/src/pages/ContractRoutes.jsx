import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ContractsPage from '../components/Contractcomp/ContractsPage';
import CreateContractPage from '../components/Contractcomp/CreateContract/index';
import { SignatureProvider } from '../components/Contractcomp/CreateContract/contexts/SignatureContext';

const ContractRoutes = () => {
  return (
    <Routes>
      <Route index element={<ContractsPage />} />
      <Route 
        path="create" 
        element={
          <SignatureProvider>
            <CreateContractPage />
          </SignatureProvider>
        } 
      />
      <Route 
        path="edit/:id" 
        element={
          <SignatureProvider>
            <CreateContractPage />
          </SignatureProvider>
        } 
      />
      <Route path="*" element={<Navigate to="/contracts" replace />} />
    </Routes>
  );
};

export default ContractRoutes; 