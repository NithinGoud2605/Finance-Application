import React, { createContext, useContext, useState, useCallback } from 'react';

const SignatureContext = createContext();

export const SignatureProvider = ({ children }) => {
  const [signatures, setSignatures] = useState({});

  // Add signature for a party
  const addSignature = useCallback((party, signatureData) => {
    setSignatures(prev => ({
      ...prev,
      [party]: signatureData
    }));
  }, []);

  // Remove signature for a party
  const removeSignature = useCallback((party) => {
    setSignatures(prev => {
      const newSignatures = { ...prev };
      delete newSignatures[party];
      return newSignatures;
    });
  }, []);

  // Clear all signatures
  const clearAllSignatures = useCallback(() => {
    setSignatures({});
  }, []);

  // Get signature for a party
  const getSignature = useCallback((party) => {
    return signatures[party] || null;
  }, [signatures]);

  // Check if all required parties have signed
  const areAllPartiesSigned = useCallback((requiredParties = ['party1', 'party2']) => {
    return requiredParties.every(party => signatures[party]);
  }, [signatures]);

  // Get signing progress
  const getSigningProgress = useCallback((requiredParties = ['party1', 'party2']) => {
    const signedCount = requiredParties.filter(party => signatures[party]).length;
    return {
      signed: signedCount,
      total: requiredParties.length,
      percentage: (signedCount / requiredParties.length) * 100
    };
  }, [signatures]);

  return (
    <SignatureContext.Provider
      value={{
        signatures,
        addSignature,
        removeSignature,
        clearAllSignatures,
        getSignature,
        areAllPartiesSigned,
        getSigningProgress,
      }}
    >
      {children}
    </SignatureContext.Provider>
  );
};

export const useSignatureContext = () => {
  const context = useContext(SignatureContext);
  if (!context) {
    throw new Error('useSignatureContext must be used within a SignatureProvider');
  }
  return context;
}; 