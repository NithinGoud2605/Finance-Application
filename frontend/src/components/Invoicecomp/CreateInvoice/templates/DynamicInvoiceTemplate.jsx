// /frontend/src/components/Invoicecomp/CreateInvoice/templates/DynamicInvoiceTemplate.jsx
import React, { Suspense, lazy, useMemo } from 'react';
import { Skeleton, Typography } from '@mui/material';
import InvoiceLayout from './InvoiceLayout';

const DynamicInvoiceTemplateSkeleton = () => (
  <Skeleton variant="rectangular" sx={{ minHeight: '60rem' }} />
);

const DynamicInvoiceTemplate = (props) => {
  const { details } = props;
  
  if (!details || !details.pdfTemplate) {
    return <Typography>No invoice template selected.</Typography>;
  }

  // Build the template name without file extension.
  const templateName = `InvoiceTemplate${details.pdfTemplate}`;

  const LazyInvoice = useMemo(() => {
    return lazy(() => {
      // Use explicit imports that Vite can statically analyze
      switch (templateName) {
        case 'InvoiceTemplate1':
          return import('./InvoiceTemplate1.jsx');
        case 'InvoiceTemplate2':
          return import('./InvoiceTemplate2.jsx');
        case 'InvoiceTemplate3':
          return import('./InvoiceTemplate3.jsx');
        case 'InvoiceTemplate4':
          return import('./InvoiceTemplate4.jsx');
        default:
          console.error('Template not found: ', templateName);
          return Promise.resolve({
          default: () => (
            <Typography color="error">
              Template {templateName} not found.
            </Typography>
          ),
          });
      }
    });
  }, [templateName]);

  const defaultLogo =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAUCAMAAAALrs4gAAAABlBMVEX///9mZ2f4F6bzAAAAy0lEQVQ4y2NgoCJ8AAAETAJkLzoBgBX1G+BQAAN1og6RR92KAJ8gf9D/2W8AXyB/0P/ZbwBfIH/Q/9lvAF8gf9D/2W8AXyB/0P/ZbwBfIH/Q/9lvAH0XlI9QDrw4zD83yiO/9r3ci99r3chDkGjvI0qhmLxA1hI8QG3kxhhwBfIH/Q/9lvAF8gf9D/2W+GRwFrg0GD/XkABx9F8DGcoDUwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0wNC0yNVQxNDoyMzoyMyswMDowMAIPHWcAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjMtMDQtMjVUMTQ6MjM6MjMrMDA6MDBPuQVJAAAAAElFTkSuQmCC";

  return (
    <InvoiceLayout data={props}>
      {/* Wrap the invoice in a container with a known id */}
      <div id="invoice-preview">
        <Suspense fallback={<DynamicInvoiceTemplateSkeleton />}>
          <LazyInvoice {...props} logo={details.invoiceLogo || defaultLogo} />
        </Suspense>
      </div>
    </InvoiceLayout>
  );
};

export default DynamicInvoiceTemplate;