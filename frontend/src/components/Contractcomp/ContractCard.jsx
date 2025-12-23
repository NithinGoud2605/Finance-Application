import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Button, Grid, CircularProgress } from '@mui/material';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { SpecialZoomLevel } from '@react-pdf-viewer/core';
import { PictureAsPdf as PictureAsPdfIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
import { getContractPdf } from '../../services/api';
import '@react-pdf-viewer/core/lib/styles/index.css';

const ContractCard = ({ contract, onEdit, onCancel, onRenew, onSendForSignature }) => {
  const { client, planName, status, startDate, endDate, pdfUrl, contractUrl } = contract;
  const clientName = client ? client.name : 'No Client';
  
  // PDF preview state
  const [pdfViewUrl, setPdfViewUrl] = useState(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  
  // Check if contract has a PDF file
  const hasPdfFile = pdfUrl || contractUrl;

  // Check if the contract is expired
  const currentDate = new Date();
  const isExpired = endDate && new Date(endDate) < currentDate && status !== 'CANCELLED';
  
  // Load PDF (fetch presigned URL only when needed)
  useEffect(() => {
    const loadPdf = async () => {
      if (!hasPdfFile || pdfViewUrl || isLoadingPdf) return;

      // If we already have a full URL/Blob string, use it directly
      const rawUrl = pdfUrl || contractUrl;
      if (typeof rawUrl === 'string' && /^(https?:\/\/|blob:)/i.test(rawUrl)) {
        setPdfViewUrl(rawUrl);
        return;
      }

      setIsLoadingPdf(true);
      setPdfError(false);

      try {
        const response = await getContractPdf(contract.id, 'view');
        if (response?.url) {
          setPdfViewUrl(response.url);
        } else {
          throw new Error('No URL returned');
        }
      } catch (error) {
        console.error('Error loading contract PDF:', error);
        setPdfError(true);
      } finally {
        setIsLoadingPdf(false);
      }
    };

    loadPdf();
  }, [contract.id, hasPdfFile, pdfViewUrl, isLoadingPdf, pdfUrl, contractUrl]);

  return (
    <Card
      sx={{
        minHeight: 420,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: client && planName && startDate ? '2px solid green' : '2px solid red',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom color="primary">
            {planName || 'No Plan Name'}
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: isExpired ? 'error.main' : 'success.main',
              fontWeight: 'medium',
              mb: 2
            }}
          >
            {isExpired ? 'Expired' : status}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            Client Information
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {clientName}
          </Typography>
          {client && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Email: {client.email || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: {client.phone || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Address: {client.address || 'N/A'}
              </Typography>
            </>
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="primary.main" gutterBottom>
            Contract Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Start Date
              </Typography>
              <Typography variant="body1">
                {startDate ? new Date(startDate).toLocaleDateString() : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                End Date
              </Typography>
              <Typography variant="body1">
                {endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            width: '100%',
            aspectRatio: '210/297',
            border: '1px solid #ddd',
            borderRadius: '10px',
            overflow: 'hidden',
            mb: 3,
            bgcolor: 'background.paper'
          }}
        >
          {isLoadingPdf ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <CircularProgress size={24} />
              <Typography variant="caption" color="text.secondary">
                Loading PDF...
              </Typography>
            </Box>
          ) : pdfViewUrl ? (
            <Worker workerUrl="/pdf.worker.min.js">
              <Viewer
                fileUrl={pdfViewUrl}
                defaultScale={SpecialZoomLevel.PageFit}
                initialPage={0}
                onDocumentLoadError={() => setPdfError(true)}
              />
            </Worker>
          ) : hasPdfFile && pdfError ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <PictureAsPdfIcon sx={{ fontSize: 32, color: 'error.main' }} />
              <Typography variant="caption" color="error">
                PDF Load Error
              </Typography>
            </Box>
          ) : hasPdfFile ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <PictureAsPdfIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary">
                PDF Available
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <AssignmentIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                No PDF available
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 1,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => onEdit(contract.id)}
          disabled={status === 'CANCELLED'}
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => onCancel(contract.id)}
        >
          Cancel
        </Button>
        <Button
          variant="outlined"
          color="success"
          size="small"
          onClick={() => onRenew(contract.id)}
        >
          Renew
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => onSendForSignature(contract.id)}
        >
          Send for Signature
        </Button>
      </Box>
    </Card>
  );
};

export default ContractCard;