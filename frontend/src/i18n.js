// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Example: define translation resources inline
// You can also split these into separate JSON files and load them via HTTP or import statements
const resources = {
  en: {
    translation: {
      form: {
        newInvBadge: "New Invoice",
        title: "Create Invoice",
        description: "Fill out the invoice details below",
        steps: {
          fromAndTo: {
            billFrom: "Bill From",
            billTo: "Bill To",
            addCustomInput: "Add Custom Input",
            name: "Name",
            address: "Address",
            zipCode: "Zip Code",
            city: "City",
            country: "Country",
            email: "Email",
            phone: "Phone"
          },
          invoiceDetails: {
            heading: "Invoice Details",
            invoiceNumber: "Invoice Number",
            issuedDate: "Issued Date",
            dueDate: "Due Date",
            currency: "Currency"
          },
          lineItems: {
            heading: "Line Items",
            addNewItem: "Add New Item"
          },
          paymentInfo: {
            heading: "Payment Information",
            bankName: "Bank Name",
            accountName: "Account Name",
            accountNumber: "Account Number"
          },
          summary: {
            heading: "Summary",
            additionalNotes: "Additional Notes",
            paymentTerms: "Payment Terms",
            signature: "Signature",
            signatureModal: {
              heading: "Add Signature",
              draw: "Draw",
              type: "Type",
              upload: "Upload"
            }
          }
        }
      }
    }
  },
  // Add more languages if needed, e.g. 'de', 'fr', etc.
};

i18n
  // Connect i18n instance with react-i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',          // default language
    fallbackLng: 'en',  // fallback language if key not found in current lng
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
