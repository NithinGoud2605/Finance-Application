import React, { createContext, useContext, useState, useCallback } from 'react';

const TranslationContext = createContext();

const dictionaries = {
  en: {
    contractLabel: 'Contract',
    party1Label: 'Party 1',
    party2Label: 'Party 2',
    contractDetailsLabel: 'Contract Details',
    objectivesLabel: 'Objectives & Deliverables',
    financialTermsLabel: 'Financial Terms',
    legalClausesLabel: 'Legal Clauses',
    summaryLabel: 'Contract Summary',
    finalSubmissionLabel: 'Final Submission',
    // Contract specific terms
    contractTypeLabel: 'Contract Type',
    startDateLabel: 'Start Date',
    endDateLabel: 'End Date',
    paymentScheduleLabel: 'Payment Schedule',
    deliverableLabel: 'Deliverable',
    milestoneLabel: 'Milestone',
    legalClauseLabel: 'Legal Clause',
    signatureLabel: 'Signature',
    // Field labels
    'field.name': 'Full Name',
    'field.email': 'Email Address',
    'field.company': 'Company Name',
    'field.position': 'Position',
    'field.phone': 'Phone Number',
    'field.country': 'Country',
    'field.address': 'Address',
    'field.city': 'City',
    'field.state': 'State/Province',
    'field.zipCode': 'ZIP/Postal Code',
    'field.title': 'Contract Title',
    // ...
  },
  es: {
    contractLabel: 'Contrato',
    party1Label: 'Parte 1',
    party2Label: 'Parte 2',
    contractDetailsLabel: 'Detalles del Contrato',
    objectivesLabel: 'Objetivos y Entregables',
    financialTermsLabel: 'Términos Financieros',
    legalClausesLabel: 'Cláusulas Legales',
    summaryLabel: 'Resumen del Contrato',
    finalSubmissionLabel: 'Envío Final',
    // Contract specific terms
    contractTypeLabel: 'Tipo de Contrato',
    startDateLabel: 'Fecha de Inicio',
    endDateLabel: 'Fecha de Fin',
    paymentScheduleLabel: 'Cronograma de Pagos',
    deliverableLabel: 'Entregable',
    milestoneLabel: 'Hito',
    legalClauseLabel: 'Cláusula Legal',
    signatureLabel: 'Firma',
    // Field labels
    'field.name': 'Nombre Completo',
    'field.email': 'Correo Electrónico',
    'field.company': 'Nombre de la Empresa',
    'field.position': 'Cargo',
    'field.phone': 'Número de Teléfono',
    'field.country': 'País',
    'field.address': 'Dirección',
    'field.city': 'Ciudad',
    'field.state': 'Estado/Provincia',
    'field.zipCode': 'Código Postal',
    'field.title': 'Título del Contrato',
    // ...
  },
  // add more languages as needed...
};

export const TranslationProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState('en');

  // Simple translator function with fallback support
  const t = useCallback(
    (key, fallback = null) => {
      return dictionaries[currentLang][key] || fallback || key;
    },
    [currentLang]
  );

  const switchLanguage = useCallback((langCode) => {
    if (dictionaries[langCode]) {
      setCurrentLang(langCode);
    }
  }, []);

  return (
    <TranslationContext.Provider value={{ t, currentLang, switchLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => useContext(TranslationContext);

// Alias for backward compatibility
export const useTranslation = () => useContext(TranslationContext); 