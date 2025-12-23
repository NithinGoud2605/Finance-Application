import { useCallback } from 'react';
import html2pdf from 'html2pdf.js';
import { useInvoiceContext } from './contexts/InvoiceContext';

export const useGeneratePdf = () => {
  const { setInvoicePdf } = useInvoiceContext();

  return useCallback(async (data) => {
    const element = document.getElementById('invoice-preview');
    if (!element) {
      console.error('Invoice preview element not found');
      return;
    }

    // Add class to disable scaling during PDF generation
    element.classList.add('pdf-generating');

    try {
      console.log('Generating PDF...');

    const opt = {
        margin: 0.25, // Simple uniform margins to match live preview
        filename: `invoice_${data?.details?.invoiceNumber || Date.now()}.pdf`,
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

      const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
      
      console.log('PDF generated successfully:', {
        size: `${(pdfBlob.size / 1024).toFixed(1)} KB`,
        type: pdfBlob.type
      });
      
        const url = URL.createObjectURL(pdfBlob);
        setInvoicePdf({ size: pdfBlob.size, url });
      
      return url;
    } catch (error) {
        console.error('Error generating PDF:', error);
      throw error;
    } finally {
      // Always remove the class after PDF generation
      element.classList.remove('pdf-generating');
        }
  }, [setInvoicePdf]);
};