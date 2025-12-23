// src/components/Invoicecomp/CreateInvoice/lib/variables.js

export const FORM_FILL_VALUES = {
  sender: {
    name: '',
    address: '',
    zipCode: '',
    city: '',
    country: '',
    email: '',
    phone: '',
    logo: '', // <-- Add this line
    customInputs: [],
  },
  receiver: {
    name: '',
    address: '',
    zipCode: '',
    city: '',
    country: '',
    email: '',
    phone: '',
    customInputs: [],
  },
  details: {
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    currency: '',
    items: [],
    charges: [], // Added charges array
    paymentInformation: {
      bankName: '',
      accountName: '',
      accountNumber: '',
    },
    additionalNotes: '',
    paymentTerms: '',
    pdfTemplate: 1,
  },
};

export const DATE_OPTIONS = { year: 'numeric', month: 'long', day: 'numeric' };

/**
 * Merge user data with the default form values.
 * For each property, if userData has a value, use it; otherwise, keep the empty default.
 */
export const getFormFillValues = (userData = {}) => {
  return {
    sender: {
      name: userData.sender?.name || '',
      address: userData.sender?.address || '',
      zipCode: userData.sender?.zipCode || '',
      city: userData.sender?.city || '',
      country: userData.sender?.country || '',
      email: userData.sender?.email || '',
      phone: userData.sender?.phone || '',
      logo: userData.sender?.logo || '',
      customInputs: userData.sender?.customInputs || [],
    },
    receiver: {
      name: userData.receiver?.name || '',
      address: userData.receiver?.address || '',
      zipCode: userData.receiver?.zipCode || '',
      city: userData.receiver?.city || '',
      country: userData.receiver?.country || '',
      email: userData.receiver?.email || '',
      phone: userData.receiver?.phone || '',
      customInputs: userData.receiver?.customInputs || [],
    },
    details: {
      invoiceNumber: userData.details?.invoiceNumber || '',
      invoiceDate: userData.details?.invoiceDate || '',
      dueDate: userData.details?.dueDate || '',
      currency: userData.details?.currency || '',
      items: userData.details?.items || [],
      charges: userData.details?.charges || [],
      paymentInformation: {
        bankName: userData.details?.paymentInformation?.bankName || '',
        accountName: userData.details?.paymentInformation?.accountName || '',
        accountNumber: userData.details?.paymentInformation?.accountNumber || '',
      },
      additionalNotes: userData.details?.additionalNotes || '',
      paymentTerms: userData.details?.paymentTerms || '',
      pdfTemplate: userData.details?.pdfTemplate || 1,
    },
  };
};
