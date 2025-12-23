import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, useTheme } from '@mui/material';
import { Download as DownloadIcon, Share as ShareIcon, Print as PrintIcon } from '@mui/icons-material';
import html2pdf from 'html2pdf.js';
import DynamicContractTemplate from '../templates/DynamicContractTemplate';

const FinalPdf = ({ contractData, onDownload, onShare, onPrint }) => {
  const theme = useTheme();
  const contractRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [error, setError] = useState('');

  const generatePdf = async () => {
    if (!contractRef.current) return;

    setIsGenerating(true);
    setError('');

    try {
      const element = contractRef.current;
      
      // Add class to disable scaling during PDF generation
      element.classList.add('pdf-generating');

      const options = {
        margin: 0.5,
        filename: `contract-${contractData?.details?.contractNumber || Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          height: element.scrollHeight,
          width: element.scrollWidth
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait',
          compress: true
        }
      };

      const pdf = await html2pdf().set(options).from(element).outputPdf('blob');
      setPdfBlob(pdf);

      // Remove the PDF generation class
      element.classList.remove('pdf-generating');

    } catch (err) {
      console.error('PDF generation failed:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contractData?.details?.contractNumber || Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      if (onDownload) onDownload();
    }
  };

  const handleShare = () => {
    if (pdfBlob && onShare) {
      onShare(pdfBlob);
    }
  };

  const handlePrint = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url);
      printWindow.onload = () => {
        printWindow.print();
        URL.revokeObjectURL(url);
      };
      
      if (onPrint) onPrint();
    }
  };

  useEffect(() => {
    if (contractData) {
      generatePdf();
    }
  }, [contractData]);

  if (!contractData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No contract data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography variant="h6">Final Contract PDF</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!pdfBlob || isGenerating}
            size="small"
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShare}
            disabled={!pdfBlob || isGenerating}
            size="small"
          >
            Share
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={!pdfBlob || isGenerating}
            size="small"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              }
            }}
          >
            Download
          </Button>
        </Box>
      </Box>

      {/* Status messages */}
      {isGenerating && (
        <Box sx={{ p: 2 }}>
          <Alert 
            severity="info" 
            icon={<CircularProgress size={20} />}
            sx={{ alignItems: 'center' }}
          >
            Generating contract PDF... This may take a few moments.
          </Alert>
        </Box>
      )}

      {error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">
            {error}
          </Alert>
        </Box>
      )}

      {/* PDF Preview */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', backgroundColor: '#f5f5f5' }}>
        <Box
          ref={contractRef}
          sx={{
            backgroundColor: '#ffffff',
            minHeight: '100%',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            margin: '20px auto',
            maxWidth: '210mm',
            
            // Hide during PDF generation to avoid recursion
            '&.pdf-generating': {
              position: 'absolute',
              left: '-9999px',
              top: '-9999px',
            }
          }}
        >
          <DynamicContractTemplate 
            {...contractData} 
            forPdf={true}
          />
        </Box>
      </Box>

      {/* PDF Blob viewer (if available) */}
      {pdfBlob && !isGenerating && (
        <Box sx={{ height: '60%', borderTop: `1px solid ${theme.palette.divider}` }}>
          <iframe
            src={URL.createObjectURL(pdfBlob)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="Contract PDF Preview"
          />
        </Box>
      )}
    </Box>
  );
};

export default FinalPdf; 