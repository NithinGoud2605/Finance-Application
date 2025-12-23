import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import html2pdf from 'html2pdf.js';

const ContractContext = createContext();

// A valid transparent 1×1 PNG fallback data URL
const transparentFallbackLogo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export const ContractProvider = ({ children }) => {
  const [contractPdf, setContractPdf] = useState({ size: 0, url: '' });
  const [savedContracts, setSavedContracts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Real-time contract data state
  const [contractData, setContractData] = useState({
    party1: {
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      registrationNumber: '',
      logo: null,
      companyName: '',
      position: '',
      phoneNumber: ''
    },
    party2: {
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      companyName: '',
      position: '',
      phoneNumber: ''
    },
    details: {
      contractNumber: `CNT-${Date.now()}`,
      title: '',
      contractType: 'service_agreement', // Valid backend enum values: service_agreement, fixed_price, time_and_materials, retainer, other, consulting, employment, nda, partnership, freelance, maintenance, license, vendor_agreement, software_license, saas_agreement, consulting_retainer, subscription, non_disclosure
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year default
      currency: 'USD',
      pdfTemplate: 1,
      description: '',
      objectives: [],
      deliverables: [],
      milestones: [],
      paymentTerms: '',
      terminationClause: '',
      additionalTerms: '',
      autoRenew: false,
      renewalPeriod: 12, // months
      confidentialityClause: '',
      liabilityClause: '',
      disputeResolution: '',
      governingLaw: '',
      notes: ''
    },
    financials: {
      totalValue: 0,
      paymentSchedule: 'monthly', // monthly, quarterly, milestone-based, upfront
      currency: 'USD',
      paymentMethod: '',
      lateFee: 0,
      retainerAmount: 0,
      expenseReimbursement: false
    },
    legal: {
      jurisdiction: '',
      arbitrationClause: false,
      forceMajeureClause: false,
      intellectualPropertyClause: '',
      nonCompeteClause: '',
      nonDisclosureClause: '',
      warrantyClause: '',
      privacyClause: ''
    },
    approvals: {
      party1Approval: false,
      party2Approval: false,
      party1ApprovedDate: null,
      party2ApprovedDate: null,
      party1Signature: null,
      party2Signature: null
    },
    status: 'DRAFT' // DRAFT, PENDING_APPROVAL, APPROVED, ACTIVE, COMPLETED, TERMINATED, CANCELLED
  });

  // Update contract data with deep merge
  const updateContractData = useCallback((newData) => {
    setContractData(prev => {
      if (typeof newData === 'function') {
        return newData(prev);
      }
      
      const result = { ...prev };
      
      Object.keys(newData).forEach(key => {
        if (newData[key] && typeof newData[key] === 'object' && !Array.isArray(newData[key])) {
          result[key] = { ...result[key], ...newData[key] };
          } else {
          result[key] = newData[key];
        }
      });
      
      return result;
    });
  }, []);

  // Update contract form data (for form context integration)
  const updateContractFormData = useCallback((formData) => {
    updateContractData(formData);
  }, [updateContractData]);

  // Calculate validation status (removed score calculation)
  const { isValid, errors: validationErrors, warnings } = useMemo(() => {
    const errors = [];
    const warnings = [];
    
    // Validate party information
    if (!contractData.party1?.name) errors.push('Party 1 name is required');
    if (!contractData.party1?.email) warnings.push('Party 1 email is recommended');
    if (!contractData.party1?.address) warnings.push('Party 1 address is recommended for contract validity');
    
    if (!contractData.party2?.name) errors.push('Party 2 name is required');
    if (!contractData.party2?.email) warnings.push('Party 2 email is recommended');
    if (!contractData.party2?.address) warnings.push('Party 2 address is recommended for contract validity');
    
    // Enhanced location validation
    if (!contractData.party1?.city || !contractData.party1?.state || !contractData.party1?.country) {
      warnings.push('Complete Party 1 location (city, state, country) is recommended');
    }
    
    if (!contractData.party2?.city || !contractData.party2?.state || !contractData.party2?.country) {
      warnings.push('Complete Party 2 location (city, state, country) is recommended');
    }
    
    // Validate contract details
    if (!contractData.details?.title) errors.push('Contract title is required');
    if (!contractData.details?.contractType) errors.push('Contract type is required');
    if (!contractData.details?.startDate) errors.push('Start date is required');
    if (!contractData.details?.endDate) warnings.push('End date is recommended for contract clarity');
    
    // Enhanced contract description validation
    if (!contractData.details?.description || contractData.details.description.length < 50) {
      warnings.push('Detailed contract description (50+ characters) is recommended for clarity');
    }
    
    // Validate dates
    const startDate = new Date(contractData.details?.startDate);
    const endDate = new Date(contractData.details?.endDate);
    
    if (contractData.details?.startDate && contractData.details?.endDate) {
      if (endDate <= startDate) {
      errors.push('End date must be after start date');
      }
    }
    
    // Validate financial terms
    if (contractData.financials?.totalValue && contractData.financials.totalValue <= 0) {
      warnings.push('Contract value should be greater than zero');
    }
    
    // Enhanced legal validation
    if (!contractData.legal?.jurisdiction) {
      warnings.push('Governing jurisdiction is recommended for legal clarity');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [contractData]);

  // Format currency
  const formatCurrency = useCallback((amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(Number(amount) || 0);
  }, []);

  // Format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  }, []);

  // Generate unique contract number
  const generateContractNumber = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CNT-${timestamp}-${random}`;
  }, []);

  // PDF Generation with better error handling (similar to invoice system)
  const generatePdf = useCallback(async (elementId = 'contract-preview', formData = null) => {
    setIsGenerating(true);
    try {
  
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Contract preview element not found');
      }

      // Add class to disable scaling during PDF generation
      element.classList.add('pdf-generating');

      // Use provided form data or current contract data
      const dataForFilename = formData || contractData;
      
      // Optimized PDF generation options
      const options = {
        margin: 0.25, // Simple uniform margins to match live preview
        filename: `contract-${dataForFilename.details?.contractNumber || Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: {
          mode: ['avoid-all', 'css'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: '.page-break-avoid'
        }
      };

      
      const pdfBlob = await html2pdf().from(element).set(options).output('blob');
      
      if (pdfBlob.size === 0) {
        throw new Error('Generated PDF blob is empty');
      }
      
      const url = URL.createObjectURL(pdfBlob);
      setContractPdf({ size: pdfBlob.size, url });

      
      return url;
    } catch (error) {
      console.error('Contract PDF generation error:', error);
      throw error;
    } finally {
      // Always remove the class after PDF generation
      const element = document.getElementById(elementId);
      if (element) {
        element.classList.remove('pdf-generating');
      }
      setIsGenerating(false);
    }
  }, [contractData]);

  // PDF utility functions (similar to invoice system)
  const previewPdfInTab = useCallback(() => {
    if (contractPdf.url) {
      window.open(contractPdf.url, '_blank');
    }
  }, [contractPdf.url]);

  const downloadPdf = useCallback(() => {
    if (contractPdf.url) {
      const link = document.createElement('a');
      link.href = contractPdf.url;
      link.download = `contract-${contractData.details.contractNumber || Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [contractPdf.url, contractData.details.contractNumber]);

  const printPdf = useCallback(() => {
    if (contractPdf.url) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = contractPdf.url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      };
    }
  }, [contractPdf.url]);

  const removeFinalPdf = useCallback(() => {
    if (contractPdf.url) {
      URL.revokeObjectURL(contractPdf.url);
    }
    setContractPdf({ size: 0, url: '' });
  }, [contractPdf.url]);

  // Calculate contract duration
  const calculateDuration = useCallback((startDate, endDate) => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);
    
    if (diffYears > 0) {
      return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  }, []);

  // Save contract to local storage
  const saveContractToLocal = useCallback((contractDataToSave = contractData) => {
    try {
      const savedContractsFromStorage = JSON.parse(localStorage.getItem('savedContracts') || '[]');
      const contractToSave = {
        ...contractDataToSave,
        id: contractDataToSave.id || generateContractNumber(),
        savedAt: new Date().toISOString()
      };
      
      const updatedContracts = [...savedContractsFromStorage, contractToSave];
      localStorage.setItem('savedContracts', JSON.stringify(updatedContracts));
      setSavedContracts(updatedContracts);
      
      return contractToSave.id;
    } catch (error) {
      console.error('Error saving contract to local storage:', error);
      throw error;
    }
  }, [contractData, generateContractNumber]);

  // Load saved contracts from local storage
  useEffect(() => {
    try {
      const savedContractsFromStorage = JSON.parse(localStorage.getItem('savedContracts') || '[]');
      setSavedContracts(savedContractsFromStorage);
    } catch (error) {
      console.error('Error loading saved contracts:', error);
    }
  }, []);

  // Reset contract
  const resetContract = useCallback(() => {
    setContractData({
      party1: {
        name: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        registrationNumber: '',
        logo: transparentFallbackLogo,
        companyName: '',
        position: '',
        phoneNumber: ''
      },
      party2: {
        name: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        companyName: '',
        position: '',
        phoneNumber: ''
      },
      details: {
        contractNumber: generateContractNumber(),
        title: '',
        contractType: 'service_agreement',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'USD',
        pdfTemplate: 1,
        description: '',
        objectives: [],
        deliverables: [],
        milestones: [],
        paymentTerms: '',
        terminationClause: '',
        additionalTerms: '',
        autoRenew: false,
        renewalPeriod: 12,
        confidentialityClause: '',
        liabilityClause: '',
        disputeResolution: '',
        governingLaw: '',
        notes: ''
      },
      financials: {
        totalValue: 0,
        paymentSchedule: 'monthly',
        currency: 'USD',
        paymentMethod: '',
        lateFee: 0,
        retainerAmount: 0,
        expenseReimbursement: false
      },
      legal: {
        jurisdiction: '',
        arbitrationClause: false,
        forceMajeureClause: false,
        intellectualPropertyClause: '',
        nonCompeteClause: '',
        nonDisclosureClause: '',
        warrantyClause: '',
        privacyClause: ''
      },
      approvals: {
        party1Approval: false,
        party2Approval: false,
        party1ApprovedDate: null,
        party2ApprovedDate: null,
        party1Signature: null,
        party2Signature: null
      },
      status: 'DRAFT'
    });
    removeFinalPdf();
  }, [generateContractNumber, removeFinalPdf]);

  // Enhanced loading of contract data
  const loadContractData = useCallback((data) => {
    setContractData(data);
  }, []);

  const value = {
    // Contract data
    contractData,
    updateContractData,
    updateContractFormData,
    resetContract,
    loadContractData,
    
    // PDF management
    contractPdf,
    setContractPdf,
    isGenerating,
    generatePdf,
    previewPdfInTab,
    downloadPdf,
    printPdf,
    removeFinalPdf,
    
    // Validation
    isValid,
    validationErrors,
    warnings,
    
    // Utilities
    formatCurrency,
    formatDate,
    calculateDuration,
    generateContractNumber,
    
    // Storage
    savedContracts,
    saveContractToLocal
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContractContext = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContractContext must be used within a ContractProvider');
  }
  return context;
}; 

export default ContractContext; 