import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { motion } from 'framer-motion';

const formatNumberWithCommas = (num) => {
  if (!num) return '0.00';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper to safely format dates
const formatDate = (val) => {
  if (!val) return '';
  const date = new Date(val);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const calculateItemTotal = (unitPrice, quantity) => {
  return Number(unitPrice || 0) * Number(quantity || 0);
};

const calculateSubTotal = (items) => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + calculateItemTotal(item.unitPrice || item.price, item.quantity), 0);
};

const calculateTotal = (items, charges) => {
  const subTotal = calculateSubTotal(items);
  let total = subTotal;
  
  // Handle charges object structure
  const chargesObj = charges || {};
  
  // Tax calculation (percentage of subtotal)
  if (chargesObj.tax && Number(chargesObj.tax) > 0) {
    total += subTotal * (Number(chargesObj.tax) / 100);
  }
  
  // Discount calculation (fixed amount, not percentage)
  if (chargesObj.discount && Number(chargesObj.discount) > 0) {
    total -= Number(chargesObj.discount);
  }
  
  // Shipping calculation (fixed amount)
  if (chargesObj.shipping && Number(chargesObj.shipping) > 0) {
    total += Number(chargesObj.shipping);
  }
  
  return Math.max(0, total); // Ensure total is never negative
};

const InvoiceTemplate3 = ({ sender = {}, receiver = {}, details = {}, charges = {}, paymentInformation = {}, logo, forPdf = false }) => {
  // Forced light styling for clarity
  const effectiveBg = '#ffffff';
  const effectiveTextPrimary = '#000000';
  const effectiveTextSecondary = '#444444';
  const borderColor = '#e0e0e0';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const noHyphenStyle = {
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    hyphens: 'none',
    whiteSpace: 'normal',
    wordWrap: 'break-word'
  };

  // Logo management with proper default
  const defaultLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='100' viewBox='0 0 140 100'%3E%3Crect width='140' height='100' fill='%23f5f5f5' stroke='%23ddd' stroke-width='2'/%3E%3Ctext x='70' y='55' font-family='Arial' font-size='14' font-weight='bold' fill='%23666' text-anchor='middle'%3ELOGO%3C/text%3E%3C/svg%3E";
  const [logoSrc, setLogoSrc] = useState(logo || defaultLogo);
  useEffect(() => {
    setLogoSrc(logo || defaultLogo);
  }, [logo]);

  const handleLogoError = (e) => {
    if (e.target.src !== defaultLogo) {
      setLogoSrc(defaultLogo);
    }
  };

  // Get payment information from details or direct prop
  const paymentInfo = paymentInformation || details?.paymentInformation || {};

  // Get items from details - handle different data sources
  const items = details.items || [];
  const subTotal = calculateSubTotal(items);
  
  // Handle charges from different sources (charges prop or details.charges)
  const effectiveCharges = charges || details.charges || {};
  const totalAmount = calculateTotal(items, effectiveCharges);

  return (
    <>
      {forPdf && (
        <style>
          {`
            /* PDF-specific styles for better page breaks and spacing */
            .page-break-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .page-break-before {
              page-break-before: always !important;
              break-before: page !important;
            }
            .page-break-after {
              page-break-after: always !important;
              break-after: page !important;
            }
            .signature-area, .payment-information, .notes-section {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              min-height: 120px;
            }
            /* Prevent orphaned lines */
            table, .totals-section {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            /* Optimize spacing for PDF */
            .MuiBox-root {
              margin-bottom: 8px !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }
            .MuiTypography-root {
              margin-bottom: 4px !important;
            }
            .MuiGrid-container {
              margin-bottom: 8px !important;
            }
            /* Reduce excessive spacing between sections */
            .MuiGrid-item + .MuiGrid-item {
              margin-top: 0 !important;
            }
          `}
        </style>
      )}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ 
          minHeight: forPdf ? 'auto' : '100vh',
          width: forPdf ? '100%' : '100%',
          backgroundColor: forPdf ? '#ffffff' : '#f8f9fa',
          padding: forPdf ? '1mm 2mm' : '40px',
          margin: '0 auto',
          fontFamily: '"Arial", "Helvetica", sans-serif',
          fontSize: forPdf ? '14px' : '16px',
          lineHeight: forPdf ? '1.4' : '1.6',
          boxSizing: 'border-box'
        }}
      >
        <Box
          sx={{
            maxWidth: forPdf ? 'none' : '800px',
            width: forPdf ? '100%' : 'auto',
            margin: '0 auto',
            p: forPdf ? 2 : 4,
            bgcolor: effectiveBg,
            borderRadius: forPdf ? 0 : 2,
            boxShadow: forPdf ? 'none' : '0 2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            minHeight: forPdf ? 'auto' : 'initial',
            // Ensure content stays within bounds for PDF
            '& *': {
              maxWidth: '100% !important',
              boxSizing: 'border-box !important'
            },
            // Fix table layout for PDF
            '& table': {
              tableLayout: forPdf ? 'auto' : 'auto',
              width: '100% !important',
              borderCollapse: 'collapse !important'
            },
            '& th, & td': {
              verticalAlign: 'top !important',
              padding: forPdf ? '8px 6px !important' : '12px 16px !important',
              lineHeight: forPdf ? '1.4 !important' : '1.5 !important',
              fontSize: forPdf ? '13px !important' : 'inherit !important',
              wordWrap: 'break-word !important',
              whiteSpace: 'normal !important'
            }
          }}
        >
          {/* Header with Logo & Invoice Number */}
          <motion.div variants={itemVariants}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <img
                src={logoSrc}
                alt={`${sender.name || 'Company'} Logo`}
                style={{ maxWidth: 140, maxHeight: 100 }}
                onError={handleLogoError}
              />
              <Typography variant="h4" sx={{ color: effectiveTextPrimary, ...noHyphenStyle }}>
                Invoice #{details.invoiceNumber || 'N/A'}
              </Typography>
            </Box>
          </motion.div>

          <Divider />

          {/* Sender & Receiver */}
          <motion.div variants={itemVariants}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 3 }}>
              {/* Sender Info */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: effectiveTextPrimary, mb: 1, ...noHyphenStyle }}>
                  From:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5, color: effectiveTextSecondary, ...noHyphenStyle }}>
                  {sender.name || 'Your Company Name'}
                </Typography>
                {sender.address && (
                  <Typography variant="body2" sx={{ color: effectiveTextSecondary, mb: 0.5, ...noHyphenStyle }}>
                    {sender.address}
                  </Typography>
                )}
                {sender.city && (
                  <Typography variant="body2" sx={{ color: effectiveTextSecondary, mb: 0.5, ...noHyphenStyle }}>
                    {sender.city}
                  </Typography>
                )}
                {sender.email && (
                  <Typography variant="body2" sx={{ color: effectiveTextSecondary, ...noHyphenStyle }}>
                    {sender.email}
                  </Typography>
                )}
              </Box>
              
              {/* Receiver Info */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: effectiveTextPrimary, mb: 1, ...noHyphenStyle }}>
                  Bill To:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5, color: effectiveTextSecondary, ...noHyphenStyle }}>
                  {receiver.name || 'Client Name'}
                </Typography>
                {receiver.address && (
                  <Typography variant="body2" sx={{ color: effectiveTextSecondary, mb: 0.5, ...noHyphenStyle }}>
                    {receiver.address}
                  </Typography>
                )}
                {receiver.city && (
                  <Typography variant="body2" sx={{ color: effectiveTextSecondary, mb: 0.5, ...noHyphenStyle }}>
                    {receiver.city}
                  </Typography>
                )}
                {receiver.email && (
                  <Typography variant="body2" sx={{ color: effectiveTextSecondary, ...noHyphenStyle }}>
                    {receiver.email}
                  </Typography>
                )}
              </Box>
            </Box>
          </motion.div>

          <Divider />

          {/* Dates & Payment Terms */}
          <motion.div variants={itemVariants}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 3 }}>
              <Box>
                {details.issueDate && (
                  <Typography variant="body2" sx={{ color: effectiveTextSecondary, mb: 1, ...noHyphenStyle }}>
                    Invoice Date: {formatDate(details.issueDate)}
                  </Typography>
                )}
                {details.dueDate && (
                  <Typography variant="body2" sx={{ color: effectiveTextSecondary, ...noHyphenStyle }}>
                    Due Date: {formatDate(details.dueDate)}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: effectiveTextSecondary, ...noHyphenStyle }}>
                  Payment Terms: {details.paymentTerms || 'Due on Receipt'}
                </Typography>
              </Box>
            </Box>
          </motion.div>

          {/* Items Section */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: effectiveTextPrimary, ...noHyphenStyle }}>
                Items:
              </Typography>
              
              <Table sx={{ border: `1px solid ${borderColor}` }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: effectiveTextPrimary }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', ...noHyphenStyle }}>Description</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', ...noHyphenStyle }}>Qty</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', ...noHyphenStyle }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', ...noHyphenStyle }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow 
                      key={index}
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' },
                        '&:hover': { bgcolor: '#e3f2fd' }
                      }}
                    >
                      <TableCell sx={{ ...noHyphenStyle }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, ...noHyphenStyle }}>
                          {item.name || item.description || 'Item'}
                        </Typography>
                        {item.description && item.name && (
                          <Typography variant="caption" sx={{ color: '#666', ...noHyphenStyle }}>
                            {item.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ ...noHyphenStyle }}>
                        {item.quantity || 1}
                      </TableCell>
                      <TableCell align="right" sx={{ ...noHyphenStyle }}>
                        ${formatNumberWithCommas(item.unitPrice || item.price || 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', ...noHyphenStyle }}>
                        ${formatNumberWithCommas(calculateItemTotal(item.unitPrice || item.price, item.quantity))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </motion.div>

          {/* Totals Section */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Grid container>
                <Grid item xs={12} md={8} />
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 3, 
                    bgcolor: '#f5f5f5', 
                    borderRadius: 2,
                    border: `1px solid ${borderColor}`
                  }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" sx={{ ...noHyphenStyle }}>Subtotal:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', ...noHyphenStyle }}>
                          ${formatNumberWithCommas(subTotal)}
                        </Typography>
                      </Box>
                      
                      {effectiveCharges.tax && Number(effectiveCharges.tax) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1" sx={{ ...noHyphenStyle }}>Tax ({effectiveCharges.tax}%):</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', ...noHyphenStyle }}>
                            ${formatNumberWithCommas(subTotal * (Number(effectiveCharges.tax) / 100))}
                          </Typography>
                        </Box>
                      )}
                      
                      {effectiveCharges.discount && Number(effectiveCharges.discount) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1" sx={{ ...noHyphenStyle }}>Discount:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#d32f2f', ...noHyphenStyle }}>
                            -${formatNumberWithCommas(effectiveCharges.discount)}
                          </Typography>
                        </Box>
                      )}
                      
                      {effectiveCharges.shipping && Number(effectiveCharges.shipping) > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1" sx={{ ...noHyphenStyle }}>Shipping:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', ...noHyphenStyle }}>
                            ${formatNumberWithCommas(effectiveCharges.shipping)}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: effectiveTextPrimary, ...noHyphenStyle }}>
                          Total:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: effectiveTextPrimary, ...noHyphenStyle }}>
                          ${formatNumberWithCommas(totalAmount)} {details.currency || 'USD'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Payment Information */}
          {paymentInfo && (Object.values(paymentInfo).some(val => val && val.toString().trim() !== '') || 
           (paymentInfo.bankName || paymentInfo.accountName || paymentInfo.accountNumber || 
            paymentInfo.swiftCode || paymentInfo.routingNumber || paymentInfo.paypalEmail || 
            paymentInfo.merchantId || paymentInfo.additionalInstructions)) && (
            <motion.div variants={itemVariants}>
              <Box 
                className="payment-information page-break-avoid"
                sx={{ 
                  mb: forPdf ? '10px' : 4,
                  marginTop: forPdf ? '8px' : 2
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ color: effectiveTextPrimary, ...noHyphenStyle }}>
                  Payment Information
                </Typography>
                
                <Box sx={{ 
                  p: forPdf ? 2 : 3, 
                  bgcolor: '#f5f5f5', 
                  borderRadius: 1,
                  border: `1px solid ${borderColor}`
                }}>
                  <Grid container spacing={3}>
                    {/* Accepted Payment Methods */}
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#2c3e50', ...noHyphenStyle }}>
                        Accepted Payment Methods:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666', ...noHyphenStyle }}>
                        Bank Transfer • Credit Cards • PayPal • Check
                      </Typography>
                    </Grid>
                    
                    {/* Bank Details */}
                    {(paymentInfo.bankName || paymentInfo.accountName || paymentInfo.accountNumber || paymentInfo.swiftCode || paymentInfo.routingNumber) && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2, color: '#2c3e50', ...noHyphenStyle }}>
                          Bank Details:
                        </Typography>

                        {paymentInfo.bankName && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>Bank Name: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', ...noHyphenStyle }}>{paymentInfo.bankName}</Typography>
                          </Box>
                        )}

                        {paymentInfo.accountName && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>Account Name: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', ...noHyphenStyle }}>{paymentInfo.accountName}</Typography>
                          </Box>
                        )}

                        {paymentInfo.accountNumber && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>Account Number: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', fontFamily: 'monospace', ...noHyphenStyle }}>{paymentInfo.accountNumber}</Typography>
                          </Box>
                        )}
                        
                        {paymentInfo.swiftCode && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>SWIFT/BIC: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', fontFamily: 'monospace', ...noHyphenStyle }}>{paymentInfo.swiftCode}</Typography>
                          </Box>
                        )}
                        
                        {paymentInfo.routingNumber && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>Routing Number: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', fontFamily: 'monospace', ...noHyphenStyle }}>{paymentInfo.routingNumber}</Typography>
                          </Box>
                        )}
                      </Grid>
                    )}

                    {/* Online Payment */}
                    {(paymentInfo.paypalEmail || paymentInfo.merchantId || paymentInfo.additionalInstructions) && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2, color: '#2c3e50', ...noHyphenStyle }}>
                          Online Payment Options:
                        </Typography>
                        
                        {paymentInfo.paypalEmail && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>PayPal: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', ...noHyphenStyle }}>{paymentInfo.paypalEmail}</Typography>
                          </Box>
                        )}
                        
                        {paymentInfo.merchantId && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline', ...noHyphenStyle }}>Merchant ID: </Typography>
                            <Typography variant="body2" sx={{ display: 'inline', fontFamily: 'monospace', ...noHyphenStyle }}>{paymentInfo.merchantId}</Typography>
                          </Box>
                        )}
                        
                        {paymentInfo.additionalInstructions && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, ...noHyphenStyle }}>Payment Instructions:</Typography>
                            <Typography variant="body2" sx={{ 
                              fontStyle: 'italic',
                              lineHeight: 1.5,
                              p: 2,
                              bgcolor: 'white',
                              border: '1px solid #e9ecef',
                              borderRadius: 1,
                              ...noHyphenStyle 
                            }}>
                              {paymentInfo.additionalInstructions}
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Box>
            </motion.div>
          )}

          {/* Signature Section - Enhanced */}
          {details.signature && (
            <motion.div variants={itemVariants}>
              <Box 
                className="signature-area page-break-avoid"
                sx={{
                  mb: forPdf ? '10px' : 4,
                  marginTop: forPdf ? '10px' : 3
                }}
              >
                <Typography variant="h6" sx={{ color: effectiveTextPrimary, mb: 2, ...noHyphenStyle }}>
                  Authorized Signature:
                </Typography>
                
                <Box sx={{ 
                  p: forPdf ? 2 : 3,
                  border: '1px solid #dee2e6',
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: forPdf ? 80 : 120,
                  bgcolor: '#fafafa',
                  '& img': {
                    maxHeight: forPdf ? '60px' : '80px',
                    maxWidth: forPdf ? '200px' : '300px'
                  }
                }}>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', mb: 2 }}>
                    {/* Handle different signature types */}
                    {(() => {
                      // Handle object signature (drawn, uploaded, or typed)
                      if (typeof details.signature === 'object' && details.signature?.data) {
                        // Check if it's an image (drawn or uploaded)
                        if (typeof details.signature.data === 'string' && details.signature.data.startsWith('data:image')) {
                          return (
                            <img
                              src={details.signature.data}
                              alt="Signature"
                              style={{
                                maxHeight: 80,
                                maxWidth: 300,
                                objectFit: 'contain'
                              }}
                            />
                          );
                        }
                        // Handle typed signature with font
                        else if (details.signature.fontFamily) {
                          return (
                            <Typography
                              variant="h4"
                              sx={{
                                fontFamily: details.signature.fontFamily || 'cursive',
                                color: effectiveTextPrimary,
                                fontStyle: 'italic',
                                ...noHyphenStyle,
                              }}
                            >
                              {details.signature.data}
                            </Typography>
                          );
                        }
                        // Handle plain text in signature object
                        else {
                          return (
                            <Typography
                              variant="h4"
                              sx={{
                                fontFamily: 'cursive',
                                color: effectiveTextPrimary,
                                fontStyle: 'italic',
                                ...noHyphenStyle,
                              }}
                            >
                              {details.signature.data}
                            </Typography>
                          );
                        }
                      }
                      // Handle string signature
                      else if (typeof details.signature === 'string') {
                        // Check if it's an image data URL
                        if (details.signature.startsWith('data:image')) {
                          return (
                            <img
                              src={details.signature}
                              alt="Signature"
                              style={{
                                maxHeight: 80,
                                maxWidth: 300,
                                objectFit: 'contain'
                              }}
                            />
                          );
                        }
                        // Handle plain text signature
                        else {
                          return (
                            <Typography
                              variant="h4"
                              sx={{
                                fontFamily: 'cursive',
                                color: effectiveTextPrimary,
                                fontStyle: 'italic',
                                ...noHyphenStyle,
                              }}
                            >
                              {details.signature}
                            </Typography>
                          );
                        }
                      }
                      // No signature
                      return null;
                    })()}
                  </Box>
                    
                  {/* Signature line and date */}
                  <Box sx={{ borderTop: `1px solid ${effectiveTextPrimary}`, pt: 1, mt: 'auto' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#7f8c8d', ...noHyphenStyle }}>
                          Signature
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: '#7f8c8d', ...noHyphenStyle }}>
                          Date: {formatDate(new Date())}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          )}

          {/* Additional Notes */}
          {(details.additionalNotes || details.notes) && (
            <motion.div variants={itemVariants}>
              <Box 
                className="notes-section page-break-avoid"
                sx={{
                  mb: forPdf ? '10px' : 4,
                  marginTop: forPdf ? '8px' : 2
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: effectiveTextPrimary, mb: 2, ...noHyphenStyle }}>
                  Additional Notes:
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ ...noHyphenStyle }}>
                    {details.additionalNotes || details.notes}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div variants={itemVariants}>
            <Box sx={{ 
              p: forPdf ? '12px 0' : 3,
              textAlign: 'center',
              borderTop: `1px solid ${borderColor}`,
              bgcolor: '#f5f5f5',
              marginTop: forPdf ? '8px' : '16px'
            }}>
              <Typography variant="body2" sx={{ 
                color: '#7f8c8d',
                ...noHyphenStyle 
              }}>
                Thank you for your business!
              </Typography>
            </Box>
          </motion.div>
        </Box>
      </motion.div>
    </>
  );
};

export default InvoiceTemplate3;
